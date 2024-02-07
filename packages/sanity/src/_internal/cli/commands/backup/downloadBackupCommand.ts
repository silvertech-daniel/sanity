import {createWriteStream, existsSync, mkdirSync} from 'fs'
import {tmpdir} from 'os'
import path from 'path'
import {randomKey} from '@sanity/block-tools'
import type {
  CliCommandArguments,
  CliCommandContext,
  CliCommandDefinition,
  SanityClient,
} from '@sanity/cli'
import {absolutify} from '@sanity/util/fs'
import {isBoolean, isNumber, isString} from 'lodash'
import prettyMs from 'pretty-ms'
import {Mutex} from 'async-mutex'
import {ProgressData} from 'archiver'
import chooseBackupIdPrompt from '../../actions/backup/chooseBackupIdPrompt'
import resolveApiClient from '../../actions/backup/resolveApiClient'
import downloadAsset from '../../actions/backup/downloadAsset'
import downloadDocument from '../../actions/backup/downloadDocument'
import newProgress from '../../actions/backup/progressSpinner'
import {PaginatedGetBackupStream, File} from '../../actions/backup/fetchNextBackupPage'
import {archiveDir, humanFileSize} from '../../actions/backup/archiveDir'
import cleanupTmpDir from '../../actions/backup/cleanupTmpDir'
import {defaultApiVersion} from './backupGroup'

const debug = require('debug')('sanity:backup')

const DEFAULT_DOWNLOAD_CONCURRENCY = 10
const MAX_DOWNLOAD_CONCURRENCY = 24

type DownloadBackupOptions = {
  projectId: string
  datasetName: string
  token: string
  backupId: string
  outDir: string
  outFileName: string
  overwrite: boolean
  concurrency: number
}

const helpText = `
Options
  --backup-id <string> The backup ID to download. (required)
  --out <string>       The file or directory path the backup should download to.
  --overwrite          Allows overwriting of existing backup file.
  --concurrency <num>  Concurrent number of backup item downloads. (max: 24)

Examples
  sanity backup download DATASET_NAME --backup-id 2024-01-01-backup-1
  sanity backup download DATASET_NAME --backup-id 2024-01-01-backup-2 --out /path/to/file
  sanity backup download DATASET_NAME --backup-id 2024-01-01-backup-3 --out /path/to/file --overwrite
`

const downloadBackupCommand: CliCommandDefinition = {
  name: 'download',
  group: 'backup',
  signature: '[DATASET_NAME]',
  description: 'Download a dataset backup to a local file.',
  helpText,
  // eslint-disable-next-line max-statements
  action: async (args, context) => {
    const {output, chalk} = context
    const [client, opts] = await prepareBackupOptions(context, args)
    const {projectId, datasetName, backupId, outDir, outFileName} = opts

    // If any of the output path or file name is empty, cancel the operation.
    if (outDir === '' || outFileName === '') {
      output.print('Operation cancelled.')
      return
    }
    const outFilePath = path.join(outDir, outFileName)

    output.print('╭───────────────────────────────────────────────────────────╮')
    output.print('│                                                           │')
    output.print('│ Downloading backup for:                                   │')
    output.print(`│ ${chalk.bold('projectId')}: ${chalk.cyan(projectId).padEnd(56)} │`)
    output.print(`│ ${chalk.bold('dataset')}: ${chalk.cyan(datasetName).padEnd(58)} │`)
    output.print(`│ ${chalk.bold('backupId')}: ${chalk.cyan(backupId).padEnd(56)} │`)
    output.print('│                                                           │')
    output.print('╰───────────────────────────────────────────────────────────╯')
    output.print('')
    output.print(`Downloading backup to "${chalk.cyan(outFilePath)}"`)

    const start = Date.now()
    const progressSpinner = newProgress(output, 'Setting up backup environment...')

    // Create temporary directory to store files before bundling them into the archive at outputPath.
    // We are adding unix milliseconds and a random key to try to back up in a unique location on each attempt.
    // Temporary directories are normally deleted at the end of backup process, any unexpected exit may leave them
    // behind, hence it is important to create a unique directory for each attempt.
    // We intentionally avoid `datasetName` and `backupId`in path since some operating system have a max length
    // of 256 chars on path names and both of them can be quite long in some cases.
    const tmpOutDir = path.join(tmpdir(), `backup-${Date.now()}-${randomKey(5)}`)

    // Create required directories if they don't exist.
    for (const dir of [
      outDir,
      tmpOutDir,
      path.join(tmpOutDir, 'images'),
      path.join(tmpOutDir, 'files'),
    ]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, {recursive: true})
      }
    }

    debug('Writing to temporary directory %s', tmpOutDir)
    const tmpOutDocumentsFile = path.join(tmpOutDir, 'data.ndjson')

    // Handle concurrent writes to the same file using mutex.
    const docOutStream = createWriteStream(tmpOutDocumentsFile, {flags: 'a'})
    const docWriteMutex = new Mutex()

    try {
      const backupFileStream = new PaginatedGetBackupStream(
        client,
        opts.projectId,
        opts.datasetName,
        opts.backupId,
        opts.token,
      )

      const files: File[] = []
      let i = 0
      for await (const file of backupFileStream) {
        files.push(file)
        i++
        progressSpinner.set({
          step: `Reading backup files...`,
          update: true,
          current: i,
          total: backupFileStream.totalFiles,
        })
      }

      let totalItemsDownloaded = 0
      // This is dynamically imported because this module is ESM only and this file gets compiled to CJS at this time.
      const {default: pMap} = await import('p-map')
      await pMap(
        files,
        async (file: File) => {
          if (file.type === 'file' || file.type === 'image') {
            await downloadAsset(file.url, file.name, file.type, tmpOutDir)
          } else {
            const doc = await downloadDocument(file.url)
            await docWriteMutex.runExclusive(() => {
              docOutStream.write(`${doc}\n`)
            })
          }

          totalItemsDownloaded += 1
          progressSpinner.set({
            step: `Downloading documents and assets...`,
            update: true,
            current: totalItemsDownloaded,
            total: backupFileStream.totalFiles,
          })
        },
        {concurrency: opts.concurrency},
      )
    } catch (error) {
      progressSpinner.fail()
      let msg = error.statusCode ? error.response.body.message : error.message
      // If no message can be extracted, print the whole error.
      if (msg === undefined) {
        msg = String(error)
      }
      throw new Error(`Downloading dataset backup failed: ${msg}`)
    }

    progressSpinner.set({step: `Archiving files into a tarball...`, update: true})
    try {
      await archiveDir(tmpOutDir, outFilePath, (processedBytes: number) => {
        progressSpinner.update({
          step: `Archiving files into a tarball, ${humanFileSize(processedBytes)} bytes written...`,
        })
      })
    } catch (err) {
      progressSpinner.fail()
      throw new Error(`Archiving backup failed: ${err.message}`)
    }

    progressSpinner.set({
      step: `Cleaning up temporary files at ${chalk.cyan(`${tmpOutDir}`)}`,
    })
    cleanupTmpDir(tmpOutDir)

    progressSpinner.set({
      step: `Backup download complete [${prettyMs(Date.now() - start)}]`,
    })
    progressSpinner.succeed()
  },
}

// prepareBackupOptions validates backup options from CLI and prepares Client and DownloadBackupOptions.
async function prepareBackupOptions(
  context: CliCommandContext,
  args: CliCommandArguments,
): Promise<[SanityClient, DownloadBackupOptions]> {
  const flags = args.extOptions
  const [dataset] = args.argsWithoutOptions
  const {prompt, workDir} = context
  const {projectId, datasetName, client} = await resolveApiClient(
    context,
    dataset,
    defaultApiVersion,
  )

  const {token} = client.config()
  if (!isString(token) || token.length < 1) {
    throw new Error(`token is missing`)
  }

  const backupId = String(flags['backup-id'] || (await chooseBackupIdPrompt(context, datasetName)))
  if (backupId.length < 1) {
    throw new Error(`backup-id ${flags['backup-id']} should be a valid string`)
  }

  if (!isString(datasetName) || datasetName.length < 1) {
    throw new Error(`dataset ${datasetName} must be a valid dataset name`)
  }

  if ('concurrency' in flags) {
    if (
      !isNumber(flags.concurrency) ||
      Number(flags.concurrency) < 1 ||
      Number(flags.concurrency) > MAX_DOWNLOAD_CONCURRENCY
    ) {
      throw new Error(`concurrency should be in 1 to ${MAX_DOWNLOAD_CONCURRENCY} range`)
    }
  }

  if ('overwrite' in flags && !isBoolean(flags.overwrite)) {
    throw new Error(`overwrite should be valid boolean`)
  }

  const defaultOutFileName = `${datasetName}-backup-${backupId}.tar.gz`
  let out = await (async (): Promise<string> => {
    if ('out' in flags) {
      if (!isString(flags.out)) {
        throw new Error(`output path should be valid string`)
      }
      // Rewrite the output path to an absolute path, if it is not already.
      return absolutify(flags.out)
    }

    const input = await prompt.single({
      type: 'input',
      message: 'Output path:',
      default: path.join(workDir, defaultOutFileName),
      filter: absolutify,
    })
    return input
  })()

  // If path is a directory name, then add a default file name to the path.
  if (isPathDirName(out)) {
    out = path.join(out, defaultOutFileName)
  }

  // If the file already exists, ask for confirmation if it should be overwritten.
  if (!flags.overwrite && existsSync(out)) {
    const shouldOverwrite = await prompt.single({
      type: 'confirm',
      message: `File "${out}" already exists, would you like to overwrite it?`,
      default: false,
    })

    // If the user does not want to overwrite the file, set the output path to an empty string.
    // This should be handled by the caller of this function as cancel operation.
    if (!shouldOverwrite) {
      out = ''
    }
  }

  return [
    client,
    {
      projectId,
      datasetName,
      backupId,
      token,
      outDir: path.dirname(out),
      outFileName: path.basename(out),
      overwrite: Boolean(flags.overwrite),
      concurrency: Number(flags.concurrency) || DEFAULT_DOWNLOAD_CONCURRENCY,
    },
  ]
}

function isPathDirName(filepath: string): boolean {
  // Check if the path has an extension, commonly indicating a file
  return !/\.\w+$/.test(filepath)
}

export default downloadBackupCommand

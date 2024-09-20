import path from 'node:path'

import {type UserViteConfig} from '@sanity/cli'
import viteReact from '@vitejs/plugin-react'
import debug from 'debug'
import readPkgUp from 'read-pkg-up'
import {type ConfigEnv, type InlineConfig, mergeConfig} from 'vite'

import {createExternalFromImportMap} from './createExternalFromImportMap'
import {getSanityBrowserAliases} from './getBrowserAliases'
import {getMonorepoAliases, resolveSanityMonorepoPath} from './getMonorepoAliases'
import {getStudioEnvironmentVariables} from './getStudioEnvironmentVariables'
import {normalizeBasePath} from './helpers'
import {sanityBuildEntries} from './vite/plugin-sanity-build-entries'
import {sanityDotWorkaroundPlugin} from './vite/plugin-sanity-dot-workaround'
import {sanityFaviconsPlugin} from './vite/plugin-sanity-favicons'
import {sanityRuntimeRewritePlugin} from './vite/plugin-sanity-runtime-rewrite'

export interface ViteOptions {
  /**
   * Root path of the studio/sanity app
   */
  cwd: string

  /**
   * Base path (eg under where to serve the app - `/studio` or similar)
   * Will be normalized to ensure it starts and ends with a `/`
   */
  basePath?: string

  /**
   * Output directory (eg where to place the built files, if any)
   */
  outputDir?: string

  /**
   * Whether or not to enable source maps
   */
  sourceMap?: boolean

  /**
   * Whether or not to minify the output (only used in `mode: 'production'`)
   */
  minify?: boolean

  /**
   * HTTP development server configuration
   */
  server?: {port?: number; host?: string}

  /**
   * Mode to run vite in - eg development or production
   */
  mode: 'development' | 'production'

  importMap?: {imports?: Record<string, string>}
}

/**
 * Get a configuration object for Vite based on the passed options
 *
 * @internal Only meant for consumption inside of Sanity modules, do not depend on this externally
 */
export async function getViteConfig(options: ViteOptions): Promise<InlineConfig> {
  const {
    cwd,
    mode,
    outputDir,
    // default to `true` when `mode=development`
    sourceMap = options.mode === 'development',
    server,
    minify,
    basePath: rawBasePath = '/',
    importMap,
  } = options

  const monorepoPath = await resolveSanityMonorepoPath(cwd)
  const basePath = normalizeBasePath(rawBasePath)

  const sanityPkgPath = (await readPkgUp({cwd: __dirname}))?.path
  if (!sanityPkgPath) {
    throw new Error('Unable to resolve `sanity` module root')
  }

  const customFaviconsPath = path.join(cwd, 'static')
  const defaultFaviconsPath = path.join(path.dirname(sanityPkgPath), 'static', 'favicons')
  const staticPath = `${basePath}static`

  const viteConfig: InlineConfig = {
    // Define a custom cache directory so that sanity's vite cache
    // does not conflict with any potential local vite projects
    cacheDir: 'node_modules/.sanity/vite',
    root: cwd,
    base: basePath,
    build: {
      outDir: outputDir || path.resolve(cwd, 'dist'),
      sourcemap: sourceMap,
    },
    server: {
      host: server?.host,
      port: server?.port || 3333,
      strictPort: true,
    },
    configFile: false,
    mode,
    plugins: [
      viteReact(),
      sanityFaviconsPlugin({defaultFaviconsPath, customFaviconsPath, staticUrlPath: staticPath}),
      sanityDotWorkaroundPlugin(),
      sanityRuntimeRewritePlugin(),
      sanityBuildEntries({basePath, cwd, importMap}),
    ],
    envPrefix: 'SANITY_STUDIO_',
    logLevel: mode === 'production' ? 'silent' : 'info',
    resolve: {
      alias: monorepoPath
        ? await getMonorepoAliases(monorepoPath)
        : getSanityBrowserAliases(sanityPkgPath),
      dedupe: ['styled-components'],
    },
    define: {
      // eslint-disable-next-line no-process-env
      '__SANITY_STAGING__': process.env.SANITY_INTERNAL_ENV === 'staging',
      'process.env.MODE': JSON.stringify(mode),
      /**
       * Yes, double negatives are confusing.
       * The default value of `SC_DISABLE_SPEEDY` is `process.env.NODE_ENV === 'production'`: https://github.com/styled-components/styled-components/blob/99c02f52d69e8e509c0bf012cadee7f8e819a6dd/packages/styled-components/src/constants.ts#L34
       * Which means that in production, use the much faster way of inserting CSS rules, based on the CSSStyleSheet API (https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule)
       * while in dev mode, use the slower way of inserting CSS rules, which appends text nodes to the `<style>` tag: https://github.com/styled-components/styled-components/blob/99c02f52d69e8e509c0bf012cadee7f8e819a6dd/packages/styled-components/src/sheet/Tag.ts#L74-L76
       * There are historical reasons for this, primarily that browsers initially did not support editing CSS rules in the DevTools inspector if `CSSStyleSheet.insetRule` were used.
       * However, that's no longer the case (since Chrome 81 back in April 2020: https://developer.chrome.com/docs/css-ui/css-in-js), the latest version of FireFox also supports it,
       * and there is no longer any reason to use the much slower method in dev mode.
       */
      'process.env.SC_DISABLE_SPEEDY': JSON.stringify('false'),
      ...getStudioEnvironmentVariables({prefix: 'process.env.', jsonEncode: true}),
    },
  }

  if (mode === 'production') {
    viteConfig.build = {
      ...viteConfig.build,

      assetsDir: 'static',
      minify: minify ? 'esbuild' : false,
      emptyOutDir: false, // Rely on CLI to do this

      rollupOptions: {
        external: createExternalFromImportMap(importMap),
        input: {
          sanity: path.join(cwd, '.sanity', 'runtime', 'app.js'),
        },
      },
    }
  }

  return viteConfig
}

/**
 * Ensure Sanity entry chunk is always loaded
 *
 * @param config - User-modified configuration
 * @returns Merged configuration
 * @internal
 */
export function finalizeViteConfig(config: InlineConfig): InlineConfig {
  if (typeof config.build?.rollupOptions?.input !== 'object') {
    throw new Error(
      'Vite config must contain `build.rollupOptions.input`, and it must be an object',
    )
  }

  if (!config.root) {
    throw new Error(
      'Vite config must contain `root` property, and must point to the Sanity root directory',
    )
  }

  return mergeConfig(config, {
    build: {
      rollupOptions: {
        input: {
          sanity: path.join(config.root, '.sanity', 'runtime', 'app.js'),
        },
      },
    },
  })
}

/**
 * Merge user-provided Vite configuration object or function
 *
 * @param defaultConfig - Default configuration object
 * @param userConfig - User-provided configuration object or function
 * @returns Merged configuration
 * @internal
 */
export async function extendViteConfigWithUserConfig(
  env: ConfigEnv,
  defaultConfig: InlineConfig,
  userConfig: UserViteConfig,
): Promise<InlineConfig> {
  let config = defaultConfig

  if (typeof userConfig === 'function') {
    debug('Extending vite config using user-specified function')
    config = await userConfig(config, env)
  } else if (typeof userConfig === 'object') {
    debug('Merging vite config using user-specified object')
    config = mergeConfig(config, userConfig)
  }

  return config
}

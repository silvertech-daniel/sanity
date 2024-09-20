import path from 'node:path'
import {createJestConfig} from '../../test/config.mjs'
import fs from 'node:fs'

const cliPath = path.resolve(import.meta.dirname, './src/_internal/cli')

export default createJestConfig({
  displayName: JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8'))
    .name,
  globalSetup: '<rootDir>/test/setup/global.ts',
  setupFiles: ['<rootDir>/test/setup/environment.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup/afterEnv.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/playwright-ct',
    cliPath, // the CLI has its own jest config
  ],
})

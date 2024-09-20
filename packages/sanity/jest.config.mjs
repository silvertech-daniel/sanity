import path from 'node:path'
import {createJestConfig, readPackageName, resolveDirNameFromUrl} from '../../test/config.mjs'

const cliPath = path.resolve(resolveDirNameFromUrl(import.meta.url), './src/_internal/cli')

export default createJestConfig({
  displayName: readPackageName(import.meta.url),
  globalSetup: '<rootDir>/test/setup/global.ts',
  setupFiles: ['<rootDir>/test/setup/environment.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup/afterEnv.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/playwright-ct',
    cliPath, // the CLI has its own jest config
  ],
})

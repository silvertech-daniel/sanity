import {createJestConfig, readPackageName, resolveDirNameFromUrl} from '../../../test/config.mjs'
import fs from 'node:fs'
import path from 'node:path'
export default createJestConfig({
  displayName: readPackageName(import.meta.url),
  testEnvironment: 'node',
  rootDir: resolveDirNameFromUrl(import.meta.url),
  setupFilesAfterEnv: ['./test/setup.ts'],
})

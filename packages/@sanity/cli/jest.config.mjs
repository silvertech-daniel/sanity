import {createJestConfig, readPackageName, resolveDirNameFromUrl} from '../../../test/config.mjs'
import fs from 'node:fs'
import path from 'node:path'
export default createJestConfig({
  displayName: readPackageName(import.meta.url),
  globalSetup: '<rootDir>/test/shared/globalSetup.ts',
  globalTeardown: '<rootDir>/test/shared/globalTeardown.ts',
  rootDir: resolveDirNameFromUrl(import.meta.url),
  setupFilesAfterEnv: ['<rootDir>/test/shared/setupAfterEnv.ts'],
  slowTestThreshold: 60000,
  testEnvironment: 'node',
})

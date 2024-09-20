import {createJestConfig} from '../../../test/config.mjs'
import fs from 'node:fs'
import path from 'node:path'
export default createJestConfig({
  displayName: JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8'))
    .name,
  globalSetup: '<rootDir>/test/shared/globalSetup.ts',
  globalTeardown: '<rootDir>/test/shared/globalTeardown.ts',
  rootDir: import.meta.dirname,
  setupFilesAfterEnv: ['<rootDir>/test/shared/setupAfterEnv.ts'],
  slowTestThreshold: 60000,
  testEnvironment: 'node',
})

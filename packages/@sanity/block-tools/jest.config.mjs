import {createJestConfig} from '../../../test/config.mjs'
import fs from 'node:fs'
import path from 'node:path'
export default createJestConfig({
  displayName: JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8'))
    .name,
  testEnvironment: 'node',
  rootDir: import.meta.dirname,
  setupFilesAfterEnv: ['./test/setup.ts'],
})

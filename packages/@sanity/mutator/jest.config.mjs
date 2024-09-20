import {createJestConfig, readPackageName} from '../../../test/config.mjs'
import fs from 'node:fs'
import path from 'node:path'
export default createJestConfig({
  displayName: readPackageName(import.meta.url),
})

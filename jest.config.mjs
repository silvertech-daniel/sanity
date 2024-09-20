import path from 'node:path'
import globby from 'globby'

const jestConfigFiles = globby.sync('*/**/jest.config.mjs', {
  ignore: ['**/node_modules'],
})

const IGNORE_PROJECTS = []

const p = jestConfigFiles
  .map((file) => path.relative(import.meta.dirname, path.dirname(file)))
  .filter((projectPath) => !IGNORE_PROJECTS.includes(projectPath))
  .map((projectPath) => `<rootDir>/${projectPath}`)
/** @type {import("jest").Config} */
export default {
  projects: p,
  // Ignore e2e tests
  modulePathIgnorePatterns: ['<rootDir>/test/'],
}

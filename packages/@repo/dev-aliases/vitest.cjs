const devAliases = require('./dev-aliases.cjs')
const path = require('node:path')

const PACKAGES_PATH = path.resolve(__dirname, '..', '..')

function getViteAliases() {
  return Object.fromEntries(
    Object.entries(devAliases).map(([packageName, aliasPath]) => [
      packageName,
      path.resolve(PACKAGES_PATH, aliasPath),
    ]),
  )
}

module.exports = {
  getViteAliases,
}

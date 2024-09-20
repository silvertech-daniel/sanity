import path from 'node:path'

import readPkgUp from 'read-pkg-up'

export async function getMonorepoAliases(monorepoPath: string) {
  const {default: aliases} = await import('@repo/dev-aliases')
  return Object.fromEntries(
    Object.entries(aliases).map(([pkgName, pkgPath]) => {
      return [pkgName, path.resolve(monorepoPath, path.join('packages', pkgPath))]
    }),
  )
}

/**
 * Load information about the `sanity-io/sanity` monorepo (if applicable)
 *
 * @internal
 */
export async function resolveSanityMonorepoPath(cwd: string): Promise<string | undefined> {
  let p = cwd

  while (p !== '/') {
    const readResult = await readPkgUp({cwd: p})

    if (!readResult) {
      return undefined
    }

    if (readResult.packageJson.isSanityMonorepo) {
      return path.dirname(readResult.path)
    }

    p = path.dirname(path.dirname(readResult.path))
  }

  return undefined
}

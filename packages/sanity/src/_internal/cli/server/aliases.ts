import {type AliasOptions} from 'vite'

import {getSanityBrowserAliases} from './getBrowserAliases'
import {getMonorepoAliases} from './getMonorepoAliases'

/**
 * @internal
 */
export interface GetAliasesOptions {
  /** The path to the sanity package.json file. */
  sanityPkgPath: string
}

/**
 * Returns an object of aliases for Vite to use.
 *
 * This function is used within our build tooling to prevent multiple context errors
 * due to multiple instances of our library. It resolves the appropriate paths for
 * modules based on whether the current project is inside the Sanity monorepo or not.
 *
 * If the project is within the monorepo, it uses the source files directly for a better
 * development experience. Otherwise, it uses the `sanityPkgPath` and `conditions` to locate
 * the entry points for each subpath the Sanity module exports.
 *
 * @internal
 */
export async function getAliases({sanityPkgPath}: GetAliasesOptions): Promise<AliasOptions> {
  return (await getMonorepoAliases()) || getSanityBrowserAliases(sanityPkgPath)
}

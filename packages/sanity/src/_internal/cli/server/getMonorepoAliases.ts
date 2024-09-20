export async function getMonorepoAliases() {
  // todo: change from require.resolve to import.meta.resolve once we're ESM
  if (require.resolve('@repo/dev-aliases')) {
    const {getViteAliases} = await import('@repo/dev-aliases')
    return getViteAliases()
  }
  return undefined
}

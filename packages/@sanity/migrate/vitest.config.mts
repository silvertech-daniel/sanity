import {getViteAliases} from '@repo/dev-aliases'
import {configDefaults, defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    alias: getViteAliases(),
    typecheck: {
      exclude: [...(configDefaults.typecheck?.exclude || []), '.tmp/**', './lib/**'],
    },
    exclude: [...configDefaults.exclude, '.tmp/**', './lib/**'],
    includeSource: ['./src/**/*.ts'],
  },
})

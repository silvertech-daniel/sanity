import {dirname} from 'node:path'

export function getDirname(importMetaUrl) {
  return dirname(importMetaUrl.replace('file://', ''))
}

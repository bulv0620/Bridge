import Store from 'electron-store'
import { schema } from './schema'
import type { AppStoreSchema } from './types'

let store: Store<AppStoreSchema> | null = null

export function getStore() {
  if (!store) {
    store = new Store<AppStoreSchema>({
      name: 'settings',
      schema,
      clearInvalidConfig: true,
    })
  }

  return store
}

import type { Schema } from 'electron-store'
import type { AppStoreSchema } from './types'

export const schema: Schema<AppStoreSchema> = {
  theme: {
    type: 'string',
    enum: ['light', 'dark', 'system'],
    default: 'system',
  },
  locale: {
    type: 'string',
    enum: ['zh_CN', 'en_US'],
    default: 'en_US',
  },
}

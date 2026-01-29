import type { Schema } from 'electron-store'
import type { AppStoreSchema } from './types'

export const schema: Schema<AppStoreSchema> = {
  theme: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
    },
    required: ['mode'],
  },
}

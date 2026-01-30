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
  deviceId: {
    type: 'string',
  },
  deviceName: {
    type: 'string',
  },
  ports: {
    type: 'object',
    properties: {
      udp: {
        type: 'number',
        minimum: 1,
        maximum: 65535,
        default: 9520,
      },
      http: {
        type: 'number',
        minimum: 1,
        maximum: 65535,
        default: 9521,
      },
    },
  },
  capabilities: {
    type: 'array',
    items: {
      type: 'string',
    },
    default: [],
  },
}

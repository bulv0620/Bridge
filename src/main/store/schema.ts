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
    default: '',
  },
  deviceName: {
    type: 'string',
    default: '',
  },
  lanDiscoverable: {
    type: 'boolean',
    default: false,
  },
  ports: {
    type: 'object',
    properties: {
      udp: {
        type: 'number',
        minimum: 1,
        maximum: 65535,
      },
      http: {
        type: 'number',
        minimum: 1,
        maximum: 65535,
      },
    },
    default: {
      udp: 9520,
      http: 9521,
    },
  },
  shareInterval: {
    type: 'number',
    default: 1000,
  },
  capabilities: {
    type: 'array',
    items: {
      type: 'string',
    },
    default: [],
  },
  downloadPath: {
    type: 'string',
    default: '',
  },
}

import { ElectronAPI } from '@electron-toolkit/preload'
interface WindowAPI {
  os: typeof import('os')
  fs: typeof import('fs/promises')
  fsSync: typeof import('fs')
  path: typeof import('path')
  ftp: typeof import('basic-ftp')
  stream: typeof import('stream')
  streamBuffers: typeof import('stream-buffers')
  crypto: typeof import('crypto')
  // Add any other APIs you want to expose here
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: WindowAPI
  }

  interface HrefToPageParam {
    to: string
    query?: {
      [key: string]: any
    }
  }
}

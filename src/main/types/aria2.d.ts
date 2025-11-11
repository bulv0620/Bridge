declare interface Aria2Version {
  enabledFeatures: string[]
  version: string
}

declare interface Aria2Status {
  gid: string
  status: 'active' | 'waiting' | 'paused' | 'error' | 'complete' | 'removed'
  totalLength: string
  completedLength: string
  uploadLength: string
  bitfield: string
  downloadSpeed: string
  uploadSpeed: string
  infoHash: string
  numSeeders: string
  seeder: string
  pieceLength: string
  numPieces: string
  connections: string
  errorCode?: string
  errorMessage?: string
  files: {
    index: string
    path: string
    length: string
    completedLength: string
    selected: 'true' | 'false'
    uris: { uri: string; status: 'used' | 'waiting' }[]
  }[]
}

declare interface Aria2GlobalStat {
  downloadSpeed: string
  uploadSpeed: string
  numActive: string
  numWaiting: string
  numStopped: string
  numStoppedTotal: string
}

declare interface Aria2GlobalOption {
  dir: string
  'max-concurrent-downloads': string
  split: string
  'max-connection-per-server': string
  'max-overall-download-limit': string
  'max-overall-upload-limit': string
  'enable-dht': 'true' | 'false'
  'bt-tracker'?: string
  [key: string]: string
}

declare interface IAria2Client {
  getUrl(): string

  rpcRequest(method: string, params?: any[]): Promise<any>

  testConnection(): Promise<boolean>

  addUri(uris: string[], options?: Record<string, any>): Promise<string>

  remove(gid: string): Promise<string>

  removeDownloadResult(gid: string): Promise<string>

  pause(gid: string): Promise<string>

  unpause(gid: string): Promise<string>

  tellStatus(gid: string, keys?: string[]): Promise<Aria2Status>

  tellActive(keys?: string[]): Promise<Aria2Status[]>

  tellWaiting(offset: number, num: number, keys?: string[]): Promise<Aria2Status[]>

  tellStopped(offset: number, num: number, keys?: string[]): Promise<Aria2Status[]>

  changeGlobalOption(options: Partial<Aria2GlobalOption>): Promise<Record<string, any>>

  getGlobalOption(): Promise<Aria2GlobalOption>

  getGlobalStat(): Promise<Aria2GlobalStat>

  shutdown(): Promise<void>

  forceShutdown(): Promise<void>
}

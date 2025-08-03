export interface Aria2Version {
  enabledFeatures: string[]
  version: string
}

export interface Aria2Status {
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
  // ...你可以继续添加其它字段，比如bittorrent, etc.
}

export interface Aria2GlobalStat {
  downloadSpeed: string
  uploadSpeed: string
  numActive: string
  numWaiting: string
  numStopped: string
  numStoppedTotal: string
}

export interface Aria2GlobalOption {
  dir: string
  'max-concurrent-downloads': string
  split: string
  'max-connection-per-server': string
  'max-overall-download-limit': string
  'max-overall-upload-limit': string
  'enable-dht': 'true' | 'false'
  'bt-tracker'?: string
  [key: string]: string | undefined
}

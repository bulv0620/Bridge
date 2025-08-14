declare interface CreateWindowOptions {
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  hideMenuBar?: boolean
  location?: string
  parent?: BrowserWindow
  modal?: boolean
  resizable?: boolean
}

declare interface HrefToPageParam {
  to: string
  query?: {
    [key: string]: any
  }
}

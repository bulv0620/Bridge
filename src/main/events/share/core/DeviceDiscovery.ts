import dgram, { RemoteInfo } from 'dgram'
import os from 'os'
import { FileStore } from '../store/FileStore'
import { getWindow } from '../../../utils/window'

export class DeviceDiscovery {
  private id: string
  private platform: NodeJS.Platform
  private port: number
  private interval: number
  private server: dgram.Socket | null

  private onlineDevices: Record<string, OnlineDevice>
  private timer: NodeJS.Timeout | null
  private debug: boolean
  private running: boolean

  private fileStore: FileStore

  constructor(store: FileStore, options: DeviceDiscoveryOptions = {}) {
    this.id = crypto.randomUUID()
    this.platform = os.platform()
    this.port = options.port ?? 9520
    this.interval = options.interval ?? 2000
    this.server = null

    this.onlineDevices = {}
    this.timer = null
    this.debug = options.debug ?? false
    this.running = false

    this.fileStore = store
  }

  private log(...args: any[]) {
    if (this.debug) console.log('[DeviceDiscovery]', ...args)
  }

  /**
   * 绑定消息监听器
   */
  private setupListeners() {
    this.server!.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
      const ip = rinfo.address

      let message: BroadcastMessage

      try {
        message = JSON.parse(msg.toString())
      } catch {
        this.log('收到异常消息')
        return
      }

      const id = message.id

      if (!this.onlineDevices[id]) {
        this.onlineDevices[id] = {
          id,
          ip: ip,
          platform: message.platform,
          lastSeen: Date.now(),
          data: {
            files: message.files,
          },
          me: id === this.id,
        }
      } else {
        this.onlineDevices[id].lastSeen = Date.now()
        this.onlineDevices[id].data = message
      }

      const mainWindow = getWindow('main')
      mainWindow!.webContents.send('share:message', {
        onlineDevices: this.getOnlineDevices(),
      })
    })
  }

  /**
   * 启动服务
   * @returns
   */
  public start() {
    if (this.running) {
      this.log('服务已经在运行')
      return
    }

    this.server = dgram.createSocket('udp4')
    this.setupListeners()

    this.server.bind(this.port, () => {
      this.server!.setBroadcast(true)
      this.log(`UDP server listening on port ${this.port}`)
    })

    this.timer = setInterval(() => {
      this.broadcastMessage()
      this.cleanupOfflineDevices()
    }, this.interval)

    this.running = true
  }

  /**
   * 停止服务
   * @returns
   */
  public stop() {
    if (!this.running || !this.server) {
      this.log('服务未在运行')
      return
    }

    if (this.timer) clearInterval(this.timer)

    this.timer = null
    this.onlineDevices = {}

    try {
      this.server.close()
      this.server = null
    } catch (err) {
      this.log('关闭 server 出错:', err)
    }

    this.running = false
    this.log('服务已停止')
  }

  /**
   * 广播本机状态到所有网卡
   * @returns
   */
  private async broadcastMessage() {
    const files = await this.fileStore.getAll()
    const message: BroadcastMessage = {
      id: this.id,
      files,
      platform: this.platform,
    }
    const messageStr = JSON.stringify(message)

    const broadcastAddresses = this.getBroadcastAddresses()
    if (broadcastAddresses.length === 0) {
      this.log('没有可用的广播地址')
      return
    }

    for (const addr of broadcastAddresses) {
      this.server!.send(messageStr, 0, messageStr.length, this.port, addr, (err) => {
        if (err) {
          console.error('Error broadcasting message:', err)
        } else {
          this.log(`广播到 ${addr}:${this.port}`)
        }
      })
    }
  }

  /**
   * 获取所有可用网段
   * @returns
   */
  private getBroadcastAddresses(): string[] {
    const interfaces = os.networkInterfaces()
    const broadcasts: string[] = []

    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal && net.netmask) {
          const ipParts = net.address.split('.').map(Number)
          const maskParts = net.netmask.split('.').map(Number)

          const broadcastParts = ipParts.map((p, i) => (p & maskParts[i]) | (~maskParts[i] & 255))
          broadcasts.push(broadcastParts.join('.'))
        }
      }
    }

    return broadcasts
  }

  /**
   * 清理不活跃设备
   */
  private cleanupOfflineDevices() {
    const currentTime = Date.now()
    Object.keys(this.onlineDevices).forEach((id) => {
      if (currentTime - this.onlineDevices[id].lastSeen > this.interval * 2) {
        delete this.onlineDevices[id]
      }
    })
  }

  /**
   * 获取所有在线设备
   * @returns
   */
  public getOnlineDevices(): OnlineDevice[] {
    return Object.values(this.onlineDevices)
  }
}

import dgram, { RemoteInfo } from 'dgram'
import os from 'os'
import { FileStore } from '../store/FileStore'
import { getWindow } from '../../../utils/window'

export interface DeviceDiscoveryOptions {
  channel?: string
  udpPort?: number
  httpPort?: number
  interval?: number
}

export class DeviceDiscovery {
  private id: string
  private platform: NodeJS.Platform
  private udpPort: number
  private httpPort: number
  private interval: number
  private server: dgram.Socket | undefined

  private onlineDevices: Record<string, OnlineDevice>
  private timer: NodeJS.Timeout | null
  private running: boolean

  private fileStore: FileStore

  constructor(store: FileStore, options: DeviceDiscoveryOptions = {}) {
    this.id = crypto.randomUUID()
    this.platform = os.platform()
    this.udpPort = options.udpPort ?? 9520
    this.httpPort = options.httpPort ?? 9520
    this.interval = options.interval ?? 1000

    this.onlineDevices = {}
    this.timer = null
    this.running = false

    this.fileStore = store
  }

  /** 启动服务 */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      if (this.running) {
        console.log('⚠️ UDP server already started')
        resolve()
        return
      }

      const server = dgram.createSocket('udp4')
      this.server = server

      this.server.bind(this.udpPort, () => {
        this.setupListeners(server)
        this.setupBroadcast(server)
        console.log(`✅ UDP server listening on port ${this.udpPort}`)
        resolve()
      })
    })
  }

  /**
   * 停止服务
   * @returns
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.running || !this.server) {
        console.log('⚠️ UDP server is not running')
        resolve()
        return
      }

      if (this.timer) clearInterval(this.timer)

      this.timer = null
      this.onlineDevices = {}

      this.server.removeAllListeners()
      this.server.close(() => {
        console.log('🛑 UDP server stopped')
        this.running = false
        this.server = undefined
        resolve()
      })
    })
  }

  /** 绑定消息监听器 */
  private setupListeners(server: dgram.Socket) {
    server.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
      const ip = rinfo.address

      let message: BroadcastMessage

      try {
        message = JSON.parse(msg.toString())
        // console.log(`📦 UDP receive : ${message}`)
      } catch {
        console.log('⚠️ UDP received an abnormal message')
        return
      }

      const id = message.id

      if (!this.onlineDevices[id]) {
        this.onlineDevices[id] = {
          id,
          ip: ip,
          udpPort: this.udpPort,
          httpPort: this.httpPort,
          platform: message.platform,
          lastSeen: Date.now(),
          data: {
            files: message.files,
          },
          mine: id === this.id,
        }
      } else {
        this.onlineDevices[id].lastSeen = Date.now()
        this.onlineDevices[id].data = {
          files: message.files,
        }
      }
    })
  }

  /** 启动广播 */
  private setupBroadcast(server: dgram.Socket) {
    server.setBroadcast(true)
    this.timer = setInterval(() => {
      this.broadcastMessage(server)
      this.cleanupOfflineDevices()

      const mainWindow = getWindow('main')
      mainWindow!.webContents.send('share:message', {
        onlineDevices: this.getOnlineDevices(),
      })
    }, this.interval)

    this.running = true
  }

  /**
   * 广播本机状态到所有网卡
   * @returns
   */
  private async broadcastMessage(server: dgram.Socket) {
    const files = await this.fileStore.getAll()
    const message: BroadcastMessage = {
      id: this.id,
      files,
      platform: this.platform,
    }
    const messageStr = JSON.stringify(message)

    const broadcastAddresses = this.getBroadcastAddresses()
    if (broadcastAddresses.length === 0) {
      console.log('⚠️ No UDP broadcast address available')
      return
    }

    for (const addr of broadcastAddresses) {
      server.send(messageStr, 0, messageStr.length, this.udpPort, addr, (err) => {
        if (err) {
          console.error('⚠️ UDP broadcast error:', err)
        } else {
          // console.log(`📦 UDP broadcast to ${addr}:${this.udpPort}`)
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

  /**
   * 获取我的设备
   * @returns
   */
  public getMyDevice(): OnlineDevice {
    return this.onlineDevices[this.id]
  }
}

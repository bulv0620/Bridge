import dgram, { RemoteInfo } from 'dgram'
import os from 'os'
import { getWindow } from '../../../utils/window'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'

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

  private onlineDevices: RemoteRefMain<OnlineDevice[]>
  private timer: NodeJS.Timeout | null
  private running: boolean

  constructor(options: DeviceDiscoveryOptions = {}) {
    this.id = crypto.randomUUID()
    this.platform = os.platform()
    this.udpPort = options.udpPort ?? 9520
    this.httpPort = options.httpPort ?? 9520
    this.interval = options.interval ?? 1000

    this.onlineDevices = remoteRef('online-device', [])
    this.timer = null
    this.running = false
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
      this.onlineDevices.value = []

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
    server.on('message', async (msg: Buffer, rinfo: RemoteInfo) => {
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
      if (id === this.id) return

      const files = await this.fetchFileList(ip, message.httpPort)

      const device = this.onlineDevices.value.find((device) => device.id === id)
      if (!device) {
        this.onlineDevices.value = [
          ...this.onlineDevices.value,
          {
            id,
            ip: ip,
            udpPort: message.udpPort,
            httpPort: message.httpPort,
            platform: message.platform,
            lastSeen: Date.now(),
            data: {
              files,
            },
            mine: id === this.id,
          },
        ]
      } else {
        this.onlineDevices.update(() => {
          device.lastSeen = Date.now()
          device.data = {
            files,
          }
        })
      }
    })
  }

  /** 启动广播 */
  private setupBroadcast(server: dgram.Socket) {
    server.setBroadcast(true)
    server.setSendBufferSize(1024 * 1024)
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
    const message: BroadcastMessage = {
      id: this.id,
      platform: this.platform,
      udpPort: this.udpPort,
      httpPort: this.httpPort,
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
    this.onlineDevices.value = this.onlineDevices.value.filter(
      (device) => currentTime - device.lastSeen < this.interval * 2,
    )
  }

  /**
   * 获取所有在线设备
   * @returns
   */
  public getOnlineDevices(): OnlineDevice[] {
    return this.onlineDevices.value
  }

  /**
   * 请求设备分享的文件列表
   * @param ip
   * @param httpPort
   * @returns
   */
  private async fetchFileList(ip: string, httpPort: number): Promise<SharedFileInfo[]> {
    const url = `http://${ip}:${httpPort}/list`
    const controller = new AbortController()

    // 设置超时：this.interval
    const timeout = setTimeout(() => controller.abort(), this.interval)

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        return []
      }

      const files = await res.json()

      return Array.isArray(files) ? files : []
    } catch {
      return []
    } finally {
      clearTimeout(timeout)
    }
  }
}

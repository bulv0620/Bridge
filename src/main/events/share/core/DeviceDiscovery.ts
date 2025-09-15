import dgram, { RemoteInfo } from 'dgram'
import os from 'os'

export class DeviceDiscovery {
  private port: number
  private interval: number
  private server: dgram.Socket

  private onlineDevices: Record<string, OnlineDevice>
  private broadcastTimer: NodeJS.Timeout | null
  private cleanupTimer: NodeJS.Timeout | null
  private debug: boolean
  private running: boolean

  constructor(options: DeviceDiscoveryOptions = {}) {
    this.port = options.port ?? 9520
    this.interval = options.interval ?? 2000
    this.server = dgram.createSocket('udp4')
    this.onlineDevices = {}
    this.broadcastTimer = null
    this.cleanupTimer = null
    this.debug = options.debug ?? false
    this.running = false

    this.setupListeners()
  }

  private log(...args: any[]) {
    if (this.debug) console.log('[DeviceDiscovery]', ...args)
  }

  /**
   * 绑定消息监听器
   */
  private setupListeners() {
    this.server.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
      const ip = rinfo.address
      let message: { data: DeviceInfo }

      try {
        message = JSON.parse(msg.toString())
      } catch {
        this.log('收到异常消息')
        return
      }

      if (!this.onlineDevices[ip]) {
        this.onlineDevices[ip] = {
          ip: ip,
          lastSeen: Date.now(),
          data: message.data,
        }
      } else {
        this.onlineDevices[ip].lastSeen = Date.now()
        this.onlineDevices[ip].data = message.data
      }
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

    this.server.bind(this.port, () => {
      this.server.setBroadcast(true)
      this.log(`UDP server listening on port ${this.port}`)
    })

    this.broadcastTimer = setInterval(this.broadcastMessage.bind(this), this.interval)

    this.cleanupTimer = setInterval(this.cleanupOfflineDevices.bind(this), this.interval)

    this.running = true
  }

  /**
   * 停止服务
   * @returns
   */
  public stop() {
    if (!this.running) {
      this.log('服务未在运行')
      return
    }

    if (this.broadcastTimer) clearInterval(this.broadcastTimer)
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)

    this.broadcastTimer = null
    this.cleanupTimer = null
    this.onlineDevices = {}

    try {
      this.server.close()
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
  private broadcastMessage() {
    const message = { data: {} }
    const messageStr = JSON.stringify(message)

    const broadcastAddresses = this.getBroadcastAddresses()
    if (broadcastAddresses.length === 0) {
      this.log('没有可用的广播地址')
      return
    }

    for (const addr of broadcastAddresses) {
      this.server.send(messageStr, 0, messageStr.length, this.port, addr, (err) => {
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
    Object.keys(this.onlineDevices).forEach((ip) => {
      if (currentTime - this.onlineDevices[ip].lastSeen > this.interval * 2) {
        delete this.onlineDevices[ip]
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

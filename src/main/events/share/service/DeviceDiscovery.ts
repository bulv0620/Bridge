import dgram, { RemoteInfo } from 'dgram'
import os from 'os'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'
import { getStore } from '../../../store'
export class DeviceDiscovery {
  private readonly id: string
  private readonly udpPort: number
  private readonly httpPort: number
  private readonly interval: number
  private readonly deviceName: string

  private server?: dgram.Socket
  private timer: NodeJS.Timeout | null = null
  private running = false

  // 在线设备
  private onlineDeviceMap = new Map<string, OnlineDevice>()
  private onlineDevices: RemoteRefMain<OnlineDevice[]>

  constructor() {
    const store = getStore()

    const deviceId = store.get('deviceId')
    if (!deviceId) {
      this.id = crypto.randomUUID()
      store.set('deviceId', this.id)
    } else {
      this.id = deviceId
    }

    const deviceName = store.get('deviceName')
    if (!deviceName) {
      this.deviceName = os.hostname()
      store.set('deviceName', this.deviceName)
    } else {
      this.deviceName = deviceName
    }

    this.udpPort = store.get('ports').udp
    this.httpPort = store.get('ports').http
    this.interval = 1000

    this.onlineDevices = remoteRef('online-devices', [])
  }

  public async start(): Promise<void> {
    if (this.running) return

    const server = dgram.createSocket('udp4')
    this.server = server

    await new Promise<void>((resolve) => {
      server.bind(this.udpPort, resolve)
    })

    server.setBroadcast(true)
    server.setSendBufferSize(1024 * 1024)

    this.setupListeners(server)

    this.timer = setInterval(() => {
      this.broadcastAnnounce()
      this.cleanupOfflineDevices()
    }, this.interval)

    this.running = true
    console.log(`✅ DeviceDiscovery started on UDP ${this.udpPort}`)
  }

  public async stop(): Promise<void> {
    if (!this.running || !this.server) return

    this.broadcastBye()

    if (this.timer) clearInterval(this.timer)
    this.timer = null

    this.server.close()
    this.server.removeAllListeners()

    this.onlineDeviceMap.clear()
    this.syncOnlineDevices()

    this.running = false
    this.server = undefined

    console.log('🛑 DeviceDiscovery stopped')
  }

  public getOnlineDevices(): OnlineDevice[] {
    return this.onlineDevices.value
  }

  private setupListeners(server: dgram.Socket) {
    server.on('message', (buf: Buffer, rinfo: RemoteInfo) => {
      let msg: AnnounceMessage

      try {
        msg = JSON.parse(buf.toString())
      } catch {
        return
      }

      if (msg.v !== 1 || !msg.device?.id) return
      if (msg.device.id === this.id) return

      const now = Date.now()
      const deviceId = msg.device.id
      const ip = rinfo.address

      const existing = this.onlineDeviceMap.get(deviceId)

      // bye
      if (msg.type === 'bye') {
        if (existing) {
          this.onlineDeviceMap.delete(deviceId)
          this.syncOnlineDevices()
        }
        return
      }

      // new
      if (!existing) {
        const dev: OnlineDevice = {
          id: deviceId,
          ip,
          device: msg.device,
          services: msg.services,
          state: msg.state,

          trusted: false,
          status: 'online',
          sources: new Set(['udp']),

          firstSeenAt: now,
          lastSeenAt: now,

          hasActiveConnection: false,
          lastAnnounce: msg,
        }

        this.onlineDeviceMap.set(deviceId, dev)
        this.syncOnlineDevices()
        return
      }

      // update
      let changed = false

      if (existing.ip !== ip) {
        existing.ip = ip
        changed = true
      }

      existing.device = msg.device
      existing.services = msg.services
      existing.state = msg.state
      existing.lastSeenAt = now
      existing.status = 'online'
      existing.sources.add('udp')
      existing.lastAnnounce = msg

      if (msg.state?.clipboard) {
        existing.lastStateChangeAt = now
      }

      if (changed) {
        this.syncOnlineDevices()
      }
    })
  }

  private broadcastAnnounce() {
    if (!this.server) return

    const msg: AnnounceMessage = {
      v: 1,
      type: 'announce',
      device: {
        id: this.id,
        name: this.deviceName,
        platform: os.platform() as any,
      },
      services: {
        udp: this.udpPort,
        http: this.httpPort,
        cap: ['clipboard'],
      },
      ts: Date.now(),
    }

    this.sendBroadcast(msg)
  }

  private broadcastBye() {
    if (!this.server) return

    const msg: AnnounceMessage = {
      v: 1,
      type: 'bye',
      device: {
        id: this.id,
        name: this.deviceName,
        platform: os.platform() as any,
      },
      services: {
        udp: this.udpPort,
        cap: [],
      },
      ts: Date.now(),
    }

    this.sendBroadcast(msg)
  }

  private sendBroadcast(message: AnnounceMessage) {
    if (!this.server) return

    const payload = Buffer.from(JSON.stringify(message))
    const addrs = this.getBroadcastAddresses()

    for (const addr of addrs) {
      this.server.send(payload, this.udpPort, addr)
    }
  }

  private cleanupOfflineDevices() {
    const now = Date.now()
    let changed = false

    for (const [id, dev] of this.onlineDeviceMap) {
      const delta = now - dev.lastSeenAt

      if (delta > this.interval * 5) {
        this.onlineDeviceMap.delete(id)
        changed = true
      } else if (delta > this.interval * 2 && dev.status !== 'stale') {
        dev.status = 'stale'
        changed = true
      }
    }

    if (changed) {
      this.syncOnlineDevices()
    }
  }

  private syncOnlineDevices() {
    this.onlineDevices.value = Array.from(this.onlineDeviceMap.values())
  }

  private getBroadcastAddresses(): string[] {
    const interfaces = os.networkInterfaces()
    const result: string[] = []

    for (const nets of Object.values(interfaces)) {
      for (const net of nets ?? []) {
        if (net.family === 'IPv4' && !net.internal && net.netmask) {
          const ip = net.address.split('.').map(Number)
          const mask = net.netmask.split('.').map(Number)

          const broadcast = ip.map((p, i) => (p & mask[i]) | (~mask[i] & 255))

          result.push(broadcast.join('.'))
        }
      }
    }

    return result
  }
}

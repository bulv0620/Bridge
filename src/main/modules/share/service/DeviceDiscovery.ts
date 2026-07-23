import dgram, { RemoteInfo } from 'dgram'
import os from 'os'
import { remoteRef, RemoteRefMain } from '../../../utils/remoteRef'
import { ClipboardManager } from './ClipboardManager'
import {
  capabilities,
  httpPort,
  shareInterval,
  updPort,
  deviceId,
  deviceName,
} from '../../../config/index'
import { createLogger, shortId } from '../../../services/logging'

export class DeviceDiscovery {
  private server?: dgram.Socket
  private timer: NodeJS.Timeout | null = null
  private running = false

  // 在线设备
  private onlineDeviceMap = new Map<string, OnlineDevice>()
  private onlineDevices: RemoteRefMain<OnlineDevice[]> = remoteRef('online-devices', [])
  private logger = createLogger('discovery')
  private lastInvalidMessageLogAt = 0

  constructor(private clipboardManager: ClipboardManager) {}

  public async start(): Promise<void> {
    if (this.running) return

    const server = dgram.createSocket('udp4')
    this.server = server

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        server.removeListener('listening', onListening)
        reject(error)
      }
      const onListening = () => {
        server.removeListener('error', onError)
        resolve()
      }
      server.once('error', onError)
      server.once('listening', onListening)
      server.bind(updPort.value)
    })

    server.setBroadcast(true)
    server.setSendBufferSize(1024 * 1024)

    this.setupListeners(server)
    server.on('error', (error) => {
      this.logger.error('discovery.socket.failed', error, { port: updPort.value })
    })

    this.timer = setInterval(() => {
      this.broadcastAnnounce()
      this.cleanupOfflineDevices()
    }, shareInterval.value)

    this.running = true
    this.logger.info('discovery.started', { port: updPort.value })
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

    this.logger.info('discovery.stopped')
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
        this.logInvalidMessage('discovery.message.invalid_json')
        return
      }

      if (msg.v !== 1 || !msg.device?.id) {
        this.logInvalidMessage('discovery.message.invalid_protocol', { version: msg.v })
        return
      }
      if (msg.device.id === deviceId.value) return

      const now = Date.now()
      const sourceDeviceId = msg.device.id
      const ip = rinfo.address

      const existing = this.onlineDeviceMap.get(sourceDeviceId)

      // bye
      if (msg.type === 'bye') {
        if (existing) {
          this.onlineDeviceMap.delete(sourceDeviceId)
          this.logger.info('discovery.device.offline', {
            deviceId: shortId(sourceDeviceId),
            reason: 'bye',
          })
        }
        return
      }

      // new
      if (!existing) {
        const dev: OnlineDevice = {
          id: sourceDeviceId,
          ip,
          device: msg.device,
          services: msg.services,
          state: msg.state,

          trusted: false,
          status: 'online',
          sources: ['udp'],

          firstSeenAt: now,
          lastSeenAt: now,

          hasActiveConnection: false,
          lastAnnounce: msg,
        }

        this.onlineDeviceMap.set(sourceDeviceId, dev)
        this.logger.info('discovery.device.online', {
          deviceId: shortId(sourceDeviceId),
          platform: msg.device.platform,
          capabilities: msg.services.cap,
        })
        return
      }

      // update
      const clipboardShareEnabled = capabilities.value.includes('clipboard')
      if (
        clipboardShareEnabled &&
        existing.services.cap.includes('clipboard') &&
        msg.state &&
        msg.state.clipboard
      ) {
        // 本地启用了剪切板共享、来源设备启用了剪切板共享，来源消息中存在剪切板信息
        if (
          existing.state?.clipboard?.v !== msg.state.clipboard.v &&
          !this.clipboardManager.clipboardHistory.value.find(
            (historyItem) => historyItem.v === msg.state?.clipboard?.v,
          )
        ) {
          // 目标设备剪切板产生更新，并且内容不在本地历史记录中
          void this.clipboardManager
            .fetchClipboard(`http://${ip}:${existing.services.http}`, msg)
            .catch(() => undefined)
        }
      }

      existing.device = msg.device
      existing.services = msg.services
      existing.state = msg.state
      existing.lastSeenAt = now
      existing.status = 'online'
      existing.sources.includes('udp') || existing.sources.push('udp')
      existing.lastAnnounce = msg

      this.syncOnlineDevices()
    })
  }

  private broadcastAnnounce() {
    if (!this.server) return

    const clipboardShareEnabled = capabilities.value.includes('clipboard')

    const state: DeviceState = {}
    if (clipboardShareEnabled) {
      state.clipboard = this.clipboardManager.computeState()
    }

    const msg: AnnounceMessage = {
      v: 1,
      type: 'announce',
      device: {
        id: deviceId.value,
        name: deviceName.value,
        platform: os.platform(),
      },
      services: {
        udp: updPort.value,
        http: httpPort.value,
        cap: capabilities.value,
      },
      state,
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
        id: deviceId.value,
        name: deviceName.value,
        platform: os.platform(),
      },
      services: {
        udp: updPort.value,
        http: httpPort.value,
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
      this.server.send(payload, updPort.value, addr)
    }
  }

  private cleanupOfflineDevices() {
    const now = Date.now()
    let changed = false

    for (const [id, dev] of this.onlineDeviceMap) {
      const delta = now - dev.lastSeenAt

      if (delta > shareInterval.value * 5) {
        this.onlineDeviceMap.delete(id)
        changed = true
        this.logger.info('discovery.device.offline', {
          deviceId: shortId(id),
          reason: 'timeout',
        })
      } else if (delta > shareInterval.value * 2 && dev.status !== 'stale') {
        dev.status = 'stale'
        changed = true
        this.logger.debug('discovery.device.stale', { deviceId: shortId(id) })
      }
    }

    if (changed) {
      this.syncOnlineDevices()
    }
  }

  private syncOnlineDevices() {
    this.onlineDevices.value = Array.from(this.onlineDeviceMap.values())
  }

  private logInvalidMessage(event: string, context?: Record<string, unknown>) {
    const now = Date.now()
    if (now - this.lastInvalidMessageLogAt < 30_000) return
    this.lastInvalidMessageLogAt = now
    this.logger.debug(event, context)
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

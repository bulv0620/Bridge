type EventCallback = (...args: any[]) => void

export interface EventsApi {
  on(channel: string, callback: EventCallback): void
  off(channel: string, callback: EventCallback): void
  once(channel: string, callback: EventCallback): void
}

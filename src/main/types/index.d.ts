import type { EventsMapType } from '../events/eventLoader'

// 去掉 IpcMainInvokeEvent（第一个参数）
type StripFirstArg<F> = F extends (first: any, ...args: infer P) => infer R
  ? (...args: P) => Promise<R>
  : never

export type IpcApi = {
  [Namespace in keyof EventsMapType]: {
    [Handler in keyof EventsMapType[Namespace]]: StripFirstArg<EventsMapType[Namespace][Handler]>
  }
}

type EventCallback = (...args: any[]) => void

export interface EventsApi {
  on(channel: string, callback: EventCallback): void
  off(channel: string, callback: EventCallback): void
  once(channel: string, callback: EventCallback): void
}

declare global {
  interface Window {
    ipc: IpcApi
    events: EventsApi
  }
}

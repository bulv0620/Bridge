import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import ftp from 'basic-ftp'
import stream from 'stream'
import streamBuffers from 'stream-buffers'
import crypto from 'crypto'
import os from 'os'

// Custom APIs for renderer
const api = {
  os,
  fs,
  fsSync,
  path,
  ftp,
  stream,
  streamBuffers,
  crypto,
}

async function generateApi() {
  const api: Record<string, Record<string, (...args: any[]) => Promise<any>>> = {}
  const eventsMap: Record<string, string[]> = await ipcRenderer.invoke('get-events-map')

  for (const [namespace, events] of Object.entries(eventsMap)) {
    api[namespace] = {}
    for (const eventName of events) {
      const key = `${namespace}:${eventName}`
      api[namespace][eventName] = (...args: any[]) => ipcRenderer.invoke(key, ...args)
    }
  }

  return api
}

generateApi().then((ipc) => {
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('electron', electronAPI)
      contextBridge.exposeInMainWorld('api', api)
      contextBridge.exposeInMainWorld('ipc', ipc)
    } catch (error) {
      console.error(error)
    }
  } else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
    // @ts-ignore (define in dts)
    window.ipc = ipc
  }
})

import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import ftp from 'basic-ftp'
import { Readable } from 'stream'
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
  Readable,
  streamBuffers,
  crypto,
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

import { IpcMainInvokeEvent, shell } from 'electron'
import { PluginManager } from './utils/PluginManager'
import path from 'path'
import fs from 'fs'

const pluginManager = new PluginManager()

export async function getPluginList() {
  return pluginManager.getPluginList()
}

export async function startPlugin(_: IpcMainInvokeEvent, pluginInfo: PluginInfo) {
  return await pluginManager.runTask(pluginInfo)
}

export async function stopPlugin(_: IpcMainInvokeEvent, pluginInfo: PluginInfo) {
  return pluginManager.stopTask(pluginInfo)
}

export async function checkPluginStatus(_: IpcMainInvokeEvent, pluginName: string) {
  return pluginManager.checkPluginStatus(pluginName)
}

export async function openPluginLog(_: IpcMainInvokeEvent, pluginName: string) {
  const logPath = pluginManager.getPluginLogPath(pluginName)
  if (logPath) {
    shell.openPath(logPath)
  }
}

export async function getPluginConfig(_: IpcMainInvokeEvent, pluginName: string) {
  const configPath = pluginManager.getPluginConfigPath(pluginName)

  if (!configPath) throw new Error('Config Path Not Found')

  const language = path.extname(configPath).slice(1)
  const content = await fs.promises.readFile(configPath, 'utf-8')

  return { language, content }
}

export async function savePluginConfig(_: IpcMainInvokeEvent, pluginName: string, content: string) {
  const configPath = pluginManager.getPluginConfigPath(pluginName)

  if (!configPath) throw new Error('Config Path Not Found')

  return fs.promises.writeFile(configPath, content, 'utf-8')
}

export async function checkSupport(_: IpcMainInvokeEvent, pluginName: string) {
  return pluginManager.checkPlatformSupport(pluginName)
}

export async function getImageData(_: IpcMainInvokeEvent, pluginName: string) {
  const imagePath = pluginManager.getPluginImagePath(pluginName)

  if (!imagePath) throw new Error('Image Path Not Found')

  const buffer = await fs.promises.readFile(imagePath)
  return 'data:image/png;base64,' + buffer.toString('base64')
}

export async function stopAll() {
  await pluginManager.stopAllTasks()
}

import { IpcMainEvent, shell } from 'electron'
import { PluginManager } from './utils/PluginManager'
import path from 'path'
import fs from 'fs'

const pluginManager = new PluginManager()

export async function getPluginList() {
  return pluginManager.getPluginList()
}

export async function startPlugin(_: IpcMainEvent, pluginInfo: PluginInfo) {
  return await pluginManager.runTask(pluginInfo)
}

export async function stopPlugin(_: IpcMainEvent, pluginInfo: PluginInfo) {
  return pluginManager.stopTask(pluginInfo)
}

export async function checkPluginStatus(_: IpcMainEvent, pluginName: string) {
  return pluginManager.checkPluginStatus(pluginName)
}

export async function openPluginLog(_: IpcMainEvent, pluginName: string) {
  const logPath = pluginManager.getPluginLogPath(pluginName)
  if (logPath) {
    shell.openPath(logPath)
  }
}

export async function getPluginConfig(_: IpcMainEvent, pluginName: string) {
  const configPath = pluginManager.getPluginConfigPath(pluginName)

  if (!configPath) throw new Error('Config Path Not Found')

  const language = path.extname(configPath).slice(1)
  const content = await fs.promises.readFile(configPath, 'utf-8')

  return { language, content }
}

export async function savePluginConfig(_: IpcMainEvent, pluginName: string, content: string) {
  const configPath = pluginManager.getPluginConfigPath(pluginName)

  if (!configPath) throw new Error('Config Path Not Found')

  return fs.promises.writeFile(configPath, content, 'utf-8')
}

export async function checkSupport(_: IpcMainEvent, pluginName: string) {
  return pluginManager.checkPlatformSupport(pluginName)
}

export async function getImageData(_: IpcMainEvent, pluginName: string) {
  const imagePath = pluginManager.getPluginImagePath(pluginName)

  if (!imagePath) throw new Error('Image Path Not Found')

  const buffer = await fs.promises.readFile(imagePath)
  return 'data:image/png;base64,' + buffer.toString('base64')
}

export async function stopAll() {
  await pluginManager.stopAllTasks()
}

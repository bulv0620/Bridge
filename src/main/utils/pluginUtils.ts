import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import os from 'os'
import { createLogger } from '../services/logging'

let resourcesPath = ''
let pluginProcess: PluginProcess[] = []
const availablePlugin = new Map<string, PluginInfo>()
const logger = createLogger('plugin')

/** 初始化资源路径 */
function initResourcesPath() {
  const devPath = path.join(process.cwd(), 'resources/plugins')
  const prodPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'resources/plugins')
  resourcesPath = process.env.NODE_ENV === 'development' ? devPath : prodPath

  initPluginMap()
}

initResourcesPath()

/** 杀死进程 */
async function killProcess(pid: number) {
  const platform = os.platform()
  if (platform === 'win32') {
    return new Promise<void>((resolve, reject) => {
      const proc = spawn('taskkill', ['/PID', String(pid), '/T', '/F'])
      proc.on('exit', resolve)
      proc.on('error', reject)
    })
  } else {
    try {
      process.kill(pid, 'SIGTERM')
    } catch (err) {
      logger.warn('plugin.process.kill_failed', { pid }, err)
    }
  }
}

/** 校验进程是否存活 */
function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch (err: any) {
    return err.code === 'EPERM'
  }
}

/** 初始化plugin map */
function initPluginMap() {
  const pluginsDir = resourcesPath
  const pluginDirs = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  for (const name of pluginDirs) {
    const pluginPath = path.join(pluginsDir, name)
    const descPath = path.join(pluginPath, 'desc.json')

    const desc = fs.existsSync(descPath) ? JSON.parse(fs.readFileSync(descPath, 'utf-8')) : {}

    const plugin: PluginInfo = {
      name,
      desc,
      platforms: {
        darwin: {
          x64: {
            configPath: path.join(pluginPath, 'darwin', 'x64', desc.configPath),
            entryPath: path.join(pluginPath, 'darwin', 'x64', desc.entryPath),
          },
          arm64: {
            configPath: path.join(pluginPath, 'darwin', 'arm64', desc.configPath),
            entryPath: path.join(pluginPath, 'darwin', 'arm64', desc.entryPath),
          },
        },
        linux: {
          x64: {
            configPath: path.join(pluginPath, 'linux', 'x64', desc.configPath),
            entryPath: path.join(pluginPath, 'linux', 'x64', desc.entryPath),
          },
          arm64: {
            configPath: path.join(pluginPath, 'linux', 'arm64', desc.configPath),
            entryPath: path.join(pluginPath, 'linux', 'arm64', desc.entryPath),
          },
        },
        win32: {
          x64: {
            configPath: path.join(pluginPath, 'win32', 'x64', desc.configPath),
            entryPath: path.join(pluginPath, 'win32', 'x64', desc.entryPath + '.exe'),
          },
        },
      },
    }

    availablePlugin.set(plugin.name, plugin)
  }
}

/** 获取所有插件列表 */
export function getPluginList(): PluginInfo[] {
  return Array.from(availablePlugin.values())
}

/** 获取指定插件 */
export function getPlugin(name: string): PluginInfo | undefined {
  return availablePlugin.get(name)
}

/** 运行插件任务 */
export async function runTask(pluginInfo: PluginInfo) {
  if (pluginProcess.find((p) => p.name === pluginInfo.name)) return

  const platform = os.platform()
  const platformInfo = getPluginArchInfo(pluginInfo)

  if (!platformInfo || !platformInfo.entryPath) {
    throw new Error(`No executable for platform: ${platform}`)
  }

  const entryPath = path.resolve(platformInfo.entryPath)

  const child = spawn(entryPath, [...pluginInfo.desc['cliArgs']], {
    cwd: path.dirname(entryPath),
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  logger.info('plugin.process.started', {
    plugin: pluginInfo.name,
    pid: child.pid,
    platform,
    arch: os.arch(),
  })
  child.stdout.on('data', (data) => {
    for (const line of String(data).split(/\r?\n/).filter(Boolean)) {
      logger.debug('plugin.process.stdout', { plugin: pluginInfo.name, output: line })
    }
  })
  child.stderr.on('data', (data) => {
    for (const line of String(data).split(/\r?\n/).filter(Boolean)) {
      logger.debug('plugin.process.stderr', { plugin: pluginInfo.name, output: line })
    }
  })
  child.on('error', (error) => {
    logger.error('plugin.process.failed', error, { plugin: pluginInfo.name, pid: child.pid })
  })
  child.on('close', (code, signal) => {
    const context = { plugin: pluginInfo.name, pid: child.pid, code, signal }
    if (code === 0) {
      logger.info('plugin.process.exited', context)
    } else {
      logger.warn('plugin.process.exited', context)
    }
  })
  child.on('exit', () => {
    pluginProcess = pluginProcess.filter((p) => p.pid !== child.pid)
  })

  pluginProcess.push({ name: pluginInfo.name, pid: child.pid })
}

/** 停止任务 */
export async function stopTask(pluginInfo: PluginInfo) {
  const p = pluginProcess.find((el) => el.name === pluginInfo.name)
  if (p) {
    logger.info('plugin.process.stop_requested', { plugin: pluginInfo.name, pid: p.pid })
    await killProcess(p.pid!)
    pluginProcess = pluginProcess.filter((el) => el.name !== pluginInfo.name)
  }
}

/** 停止所有任务 */
export async function stopAllTasks() {
  for (const p of pluginProcess) {
    logger.info('plugin.process.stop_requested', { plugin: p.name, pid: p.pid })
    await killProcess(p.pid!)
  }
  pluginProcess = []
}

/** 检查插件运行状态 */
export function checkPluginStatus(name: string) {
  const p = pluginProcess.find((el) => el.name === name)
  return p ? isProcessAlive(p.pid!) : false
}

/** 获取插件的配置文件路径 */
export function getPluginConfPath(pluginInfo: PluginInfo) {
  const platformInfo = getPluginArchInfo(pluginInfo)

  if (!platformInfo || !platformInfo.configPath) {
    return ''
  }

  return platformInfo.configPath || ''
}

export function getPluginArchInfo(plugin: PluginInfo): PluginArchInfo | undefined {
  const platform = os.platform() as Platform
  const arch = os.arch() as Arch

  return plugin.platforms[platform]?.[arch]
}

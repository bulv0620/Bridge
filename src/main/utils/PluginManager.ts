import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import * as os from 'os'

let resourcesPath = ''
let pluginProcess: PluginProcess[] = []
const availablePlugin = new Map<string, PluginInfo>()

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
      console.warn(`Failed to kill process ${pid}:`, err)
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
      platforms: {},
    }

    for (const platform of ['mac', 'win', 'linux'] as const) {
      const platformPath = path.join(pluginPath, platform)
      if (fs.existsSync(platformPath) && fs.statSync(platformPath).isDirectory()) {
        const files = fs.readdirSync(platformPath)
        const execFile = files.find((f) => f.startsWith('entry'))
        plugin.platforms[platform] = {
          exec: execFile ? path.resolve(platformPath, execFile) : null,
          config: desc['configPath'] ? path.resolve(platformPath, desc['configPath']) : null,
          log: desc['logPath'] ? path.resolve(platformPath, desc['logPath']) : null,
        }
      }
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
  const platformInfo =
    platform === 'darwin'
      ? pluginInfo.platforms.mac
      : platform === 'win32'
        ? pluginInfo.platforms.win
        : pluginInfo.platforms.linux

  if (!platformInfo || !platformInfo.exec) {
    throw new Error(`No executable for platform: ${platform}`)
  }

  const execPath = path.resolve(platformInfo.exec)

  const child = spawn(execPath, [...pluginInfo.desc['cliArgs']], {
    cwd: path.dirname(execPath),
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (d) => console.log(`stdout: ${d}`))
  child.stderr.on('data', (d) => console.error(`stderr: ${d}`))
  child.on('close', (code) => console.log(`${pluginInfo.name} exited with ${code}`))
  child.on('exit', () => {
    pluginProcess = pluginProcess.filter((p) => p.pid !== child.pid)
  })

  pluginProcess.push({ name: pluginInfo.name, pid: child.pid })
}

/** 停止任务 */
export async function stopTask(pluginInfo: PluginInfo) {
  const p = pluginProcess.find((el) => el.name === pluginInfo.name)
  if (p) {
    await killProcess(p.pid!)
    pluginProcess = pluginProcess.filter((el) => el.name !== pluginInfo.name)
  }
}

/** 停止所有任务 */
export async function stopAllTasks() {
  for (const p of pluginProcess) {
    await killProcess(p.pid!)
  }
  pluginProcess = []
}

/** 检查插件运行状态 */
export function checkPluginStatus(name: string) {
  const p = pluginProcess.find((el) => el.name === name)
  return p ? isProcessAlive(p.pid!) : false
}

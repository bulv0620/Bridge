import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import * as os from 'os'

export interface PlatformInfo {
  exec: string | null
  config: string | null
  log: string | null
}

export interface PluginInfo {
  name: string
  desc: Record<string, any>
  iconPath: string
  platforms: {
    mac?: PlatformInfo
    win?: PlatformInfo
    linux?: PlatformInfo
  }
}

export interface PluginProcess {
  name: string
  pid?: number
}

// 开发环境路径（Vite 的 public 目录）
const devResourcesPath = path.join(process.cwd(), 'resources/plugins')
// 生产环境路径（打包后的资源目录）
const prodResourcesPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'resources/plugins')
// 实际当前环境的插件目录
const resourcesPath = process.env.NODE_ENV === 'development' ? devResourcesPath : prodResourcesPath

// 当前执行的插件列表
const pluginProcess: PluginProcess[] = []

// 通用的进程终止函数
function killProcess(pid: number) {
  return new Promise<void>((resolve, reject) => {
    const platformName = os.platform()

    if (platformName === 'win32') {
      // Windows 使用 taskkill
      const killProcess = spawn('taskkill', ['/PID', String(pid), '/T', '/F'])
      killProcess.on('exit', resolve)
      killProcess.on('error', reject)
    } else {
      // macOS / Linux 使用 kill 命令
      try {
        process.kill(pid, 'SIGTERM') // 或 'SIGKILL' 更强制
        resolve()
      } catch (err) {
        console.warn(`Failed to kill process ${pid}:`, err)
        reject(err)
      }
    }
  })
}

// 通用的进程检查函数
function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch (err: any) {
    // ESRCH: No such process
    // EPERM: Process exists, but no permission to send signal
    return err.code === 'EPERM' ? true : false
  }
}

/**
 * 获取所有插件接口
 * @returns 插件信息
 */
export function getPluginInfo(): PluginInfo[] {
  const pluginsDir = resourcesPath

  const pluginDirs = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  const result: PluginInfo[] = []

  for (const pluginName of pluginDirs) {
    const pluginPath = path.join(pluginsDir, pluginName)
    const descPath = path.join(pluginPath, 'desc.json')
    const iconPath = path.join(pluginPath, 'icon.png')

    const plugin: PluginInfo = {
      name: pluginName,
      desc: fs.existsSync(descPath) ? JSON.parse(fs.readFileSync(descPath, 'utf-8')) : {},
      iconPath,
      platforms: {},
    }

    for (const platform of ['mac', 'win', 'linux'] as const) {
      const platformPath = path.join(pluginPath, platform)
      if (fs.existsSync(platformPath) && fs.statSync(platformPath).isDirectory()) {
        const files = fs.readdirSync(platformPath)
        const execFile = files.find((file) => file.startsWith('entry'))

        plugin.platforms[platform] = {
          exec: execFile ? path.resolve(platformPath, execFile) : null,
          config: plugin.desc['configPath']
            ? path.resolve(platformPath, plugin.desc['configPath'])
            : null,
          log: plugin.desc['logPath'] ? path.resolve(platformPath, plugin.desc['logPath']) : null,
        }
      }
    }

    result.push(plugin)
  }

  return result
}

/**
 * 运行插件
 * @param pluginInfo
 * @returns
 */
export function runTask(pluginInfo: PluginInfo): Promise<void> {
  return new Promise((resolve, reject) => {
    if (pluginProcess.find((el) => el.name === pluginInfo.name)) {
      resolve()
      return
    }

    const platform = os.platform()
    let platformInfo: PlatformInfo | undefined

    if (platform === 'darwin') {
      platformInfo = pluginInfo.platforms.mac
    } else if (platform === 'win32') {
      platformInfo = pluginInfo.platforms.win
    } else if (platform === 'linux') {
      platformInfo = pluginInfo.platforms.linux
    } else {
      reject(new Error(`Unsupported platform: ${platform}`))
      return
    }

    if (!platformInfo || !platformInfo.exec) {
      reject(new Error(`No executable configured for platform: ${platform}`))
      return
    }

    const execPath = path.resolve(platformInfo.exec)

    console.log(`Running plugin: ${pluginInfo.name}`)
    console.log(`Executing: ${execPath}`)

    const child = spawn(execPath, [...pluginInfo.desc['cliArgs']], {
      cwd: path.dirname(execPath), // 工作目录=脚本目录
    })

    pluginProcess.push({
      name: pluginInfo.name,
      pid: child.pid,
    })

    // 启动成功，立即 resolve
    resolve()
  })
}

/**
 * 停止运行插件
 * @param pluginInfo
 */
export async function stopTask(pluginInfo: PluginInfo) {
  const index = pluginProcess.findIndex((el) => el.name === pluginInfo.name)
  if (index > -1) {
    await killProcess(pluginProcess[index].pid!)
    pluginProcess.splice(index, 1)
  }
}

/**
 * 检查插件的运行状态
 * @param name
 * @returns
 */
export function checkPluginStatus(name: string): Boolean {
  const p = pluginProcess.find((el) => el.name === name)

  if (!p) return false
  return isProcessAlive(p.pid!)
}

/**
 * 结束所有插件Promise返回
 * @returns
 */
export async function stopAllTasks() {
  for (const p of pluginProcess) {
    await killProcess(p.pid!)
  }
}

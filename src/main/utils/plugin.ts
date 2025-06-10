import path from 'path'
import fs from 'fs'
import { ChildProcess, spawn } from 'child_process'
import * as os from 'os'

export interface PlatformInfo {
  exec: string | null
  config: string | null
  log: string
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
  process: ChildProcess
}

// 开发环境路径（Vite 的 public 目录）
const devResourcesPath = path.join(process.cwd(), 'resources/plugins')
// 生产环境路径（打包后的资源目录）
const prodResourcesPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'resources/plugins')
// 实际当前环境的插件目录
const resourcesPath = process.env.NODE_ENV === 'development' ? devResourcesPath : prodResourcesPath

// 当前执行的插件列表
const pluginProcess: PluginProcess[] = []

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
        const configFile = files.find((file) => file === 'config.json')

        plugin.platforms[platform] = {
          exec: execFile ? path.resolve(platformPath, execFile) : null,
          config: configFile ? path.resolve(platformPath, configFile) : null,
          log: path.resolve(platformPath, '.log'),
        }
      }
    }

    result.push(plugin)
  }

  return result
}

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
    const logPath = path.resolve(platformInfo.log)

    try {
      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(path.dirname(logPath), { recursive: true })
        fs.writeFileSync(logPath, '', { flag: 'w' })
      }
    } catch (err) {
      reject(new Error(`Failed to create log file: ${(err as Error).message}`))
      return
    }

    console.log(`Running plugin: ${pluginInfo.name}`)
    console.log(`Executing: ${execPath}`)

    const child = spawn(execPath, [], {
      cwd: path.dirname(execPath), // ✅ 关键设置：工作目录=脚本目录
    })

    const logStream = fs.createWriteStream(logPath, { flags: 'a' })

    child.stdout.on('data', (data) => {
      const text = data.toString()
      console.log(`[STDOUT] ${text}`)
      logStream.write(`[STDOUT] ${text}`)
    })

    child.stderr.on('data', (data) => {
      const text = data.toString()
      console.error(`[STDERR] ${text}`)
      logStream.write(`[STDERR] ${text}`)
    })

    child.on('error', (err) => {
      console.error(`[ERROR] ${err.message}`)
      logStream.write(`[ERROR] ${err.message}\n`)
      logStream.end()
      reject(err)
    })

    child.on('exit', (code) => {
      const exitMessage = `Plugin '${pluginInfo.name}' exited with code ${code}\n`
      logStream.write(exitMessage)
      logStream.end()

      const index = pluginProcess.findIndex((el) => el.name === pluginInfo.name)
      if (index > -1) {
        pluginProcess.splice(index, 1)
      }
    })

    pluginProcess.push({
      name: pluginInfo.name,
      process: child,
    })

    // 启动成功，立即 resolve
    resolve()
  })
}

export function stopTask(pluginInfo: PluginInfo): void {
  const index = pluginProcess.findIndex((el) => el.name === pluginInfo.name)
  if (index > -1) {
    const child = pluginProcess[index].process
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'])
  }
}

export function stopAllTasks(): void {
  pluginProcess.forEach((plugin) => {
    const child = plugin.process
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'])
  })
  console.log('all stoped')
  pluginProcess.splice(0) // 清空当前执行的插件列表
}

export function checkPluginStatus(name: string): Boolean {
  return !!pluginProcess.find((el) => el.name === name)
}

export function stopAllTasksAsync(): Promise<void> {
  return new Promise((resolve) => {
    const children = pluginProcess.map((p) => p.process)
    if (children.length === 0) {
      resolve()
      return
    }
    let completed = 0
    children.forEach((child) => {
      spawn('taskkill', ['/F', '/T', '/PID', String(child.pid)]).on('exit', () => {
        completed++
        if (completed === children.length) {
          pluginProcess.splice(0) // 清空任务
          resolve()
        }
      })
    })
  })
}

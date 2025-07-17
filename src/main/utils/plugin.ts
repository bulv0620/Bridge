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

// 通用的进程终止函数
function killProcess(pid: number) {
  const platformName = os.platform()

  if (platformName === 'win32') {
    // Windows 使用 taskkill
    spawn('taskkill', ['/PID', String(pid), '/T', '/F'])
  } else {
    // macOS / Linux 使用 kill 命令
    try {
      process.kill(pid, 'SIGTERM') // 或 'SIGKILL' 更强制
    } catch (err) {
      console.warn(`Failed to kill process ${pid}:`, err)
    }
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

    let logStream = fs.createWriteStream(logPath, { flags: 'a' })
    let currentLogLines = 0

    // 计算当前数据的行数
    function countLines(data: string): number {
      return (data.match(/\n/g)?.length || 0) + 1
    }

    // 日志轮转
    function rotateLogFile() {
      try {
        logStream.end() // 关闭当前流
        const content = fs.readFileSync(logPath, 'utf8')
        const lines = content.split('\n')
        if (lines.length > 3000) {
          const newLines = lines.slice(-3000)
          fs.writeFileSync(logPath, newLines.join('\n'))
          currentLogLines = newLines.length // 重置计数器
        }
        // 重新打开日志流
        logStream = fs.createWriteStream(logPath, { flags: 'a' })
        return logStream
      } catch (err) {
        console.error('Error rotating log file:', err)
        return null
      }
    }

    // 写日志并每1000行或者超过3000行时轮转日志
    function writeLog(logText: string) {
      logStream.write(logText)

      const newLines = countLines(logText)
      currentLogLines += newLines

      if (currentLogLines >= 3000 || (currentLogLines % 1000 === 0 && currentLogLines > 0)) {
        const newStrem = rotateLogFile()
        if (newStrem) {
          logStream = newStrem
        }
      }
    }

    child.stdout.on('data', (data) => {
      const text = data.toString()
      console.log(`[STDOUT] ${text}`)
      writeLog(`[STDOUT] ${text}`)
    })

    child.stderr.on('data', (data) => {
      const text = data.toString()
      console.error(`[STDERR] ${text}`)
      writeLog(`[STDERR] ${text}`)
    })

    child.on('error', (err) => {
      console.error(`[ERROR] ${err.message}`)
      writeLog(`[ERROR] ${err.message}\n`)
      logStream.end()
      reject(err)
    })

    child.on('exit', (code) => {
      const exitMessage = `Plugin '${pluginInfo.name}' exited with code ${code}\n`
      writeLog(exitMessage)
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
    killProcess(child.pid!)
  }
}

export function stopAllTasks(): void {
  pluginProcess.forEach((plugin) => {
    killProcess(plugin.process.pid!)
  })
  console.log('all stopped')
  pluginProcess.splice(0)
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
    const total = children.length

    children.forEach((child) => {
      const done = () => {
        completed++
        if (completed === total) {
          pluginProcess.splice(0)
          resolve()
        }
      }

      const platformName = os.platform()

      if (platformName === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', String(child.pid)]).on('exit', done)
      } else {
        try {
          process.kill(child.pid!, 'SIGTERM')
        } catch (err) {
          console.warn(`Failed to kill process ${child.pid}:`, err)
        }
        done()
      }
    })
  })
}

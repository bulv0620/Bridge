import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import * as os from 'os'

export class PluginManager {
  private resourcesPath: string
  private pluginProcess: PluginProcess[] = []
  private availablePluginList: PluginInfo[] = []

  constructor() {
    const devResourcesPath = path.join(process.cwd(), 'resources/plugins')
    const prodResourcesPath = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'resources/plugins',
    )

    this.resourcesPath =
      process.env.NODE_ENV === 'development' ? devResourcesPath : prodResourcesPath
  }

  checkPlatformSupport(pluginName: string) {
    const pluginInfo = this.availablePluginList.find((plugin) => plugin.name === pluginName)

    if (pluginInfo) {
      const platform = os.platform()

      if (platform === 'darwin') {
        return !!pluginInfo.platforms.mac
      } else if (platform === 'win32') {
        return !!pluginInfo.platforms.win
      } else if (platform === 'linux') {
        return !!pluginInfo.platforms.linux
      } else {
        return false
      }
    } else {
      return false
    }
  }

  getPluginImagePath(pluginName: string) {
    const pluginInfo = this.availablePluginList.find((plugin) => plugin.name === pluginName)

    if (pluginInfo) {
      return pluginInfo.iconPath
    } else {
      return ''
    }
  }

  getPluginLogPath(pluginName: string) {
    const pluginInfo = this.availablePluginList.find((plugin) => plugin.name === pluginName)

    const platform = os.platform()
    if (pluginInfo) {
      if (platform === 'linux') {
        return pluginInfo.platforms.linux?.log
      } else if (platform === 'darwin') {
        return pluginInfo.platforms.mac?.log
      } else if (platform === 'win32') {
        return pluginInfo.platforms.win?.log
      }
      return ''
    } else {
      return ''
    }
  }

  getPluginConfigPath(pluginName: string) {
    const pluginInfo = this.availablePluginList.find((plugin) => plugin.name === pluginName)

    const platform = os.platform()
    if (pluginInfo) {
      if (platform === 'linux') {
        return pluginInfo.platforms.linux?.config
      } else if (platform === 'darwin') {
        return pluginInfo.platforms.mac?.config
      } else if (platform === 'win32') {
        return pluginInfo.platforms.win?.config
      }
      return ''
    } else {
      return ''
    }
  }

  private async killProcess(pid: number) {
    const platformName = os.platform()
    if (platformName === 'win32') {
      return new Promise<void>((resolve, reject) => {
        const killProcess = spawn('taskkill', ['/PID', String(pid), '/T', '/F'])
        killProcess.on('exit', resolve)
        killProcess.on('error', reject)
      })
    } else {
      return new Promise<void>((resolve, reject) => {
        try {
          process.kill(pid, 'SIGTERM')
          resolve()
        } catch (err) {
          console.warn(`Failed to kill process ${pid}:`, err)
          reject(err)
        }
      })
    }
  }

  private isProcessAlive(pid: number) {
    try {
      process.kill(pid, 0)
      return true
    } catch (err: any) {
      return err.code === 'EPERM' ? true : false
    }
  }

  public getPluginList(): PluginInfo[] {
    const pluginsDir = this.resourcesPath
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

    this.availablePluginList = result

    return result
  }

  public async runTask(pluginInfo: PluginInfo) {
    if (this.pluginProcess.find((el) => el.name === pluginInfo.name)) {
      return
    }

    const platform = os.platform()
    let platformInfo: PluginPlatformInfo | undefined

    if (platform === 'darwin') platformInfo = pluginInfo.platforms.mac
    else if (platform === 'win32') platformInfo = pluginInfo.platforms.win
    else if (platform === 'linux') platformInfo = pluginInfo.platforms.linux
    else throw new Error(`Unsupported platform: ${platform}`)

    if (!platformInfo || !platformInfo.exec) {
      throw new Error(`No executable configured for platform: ${platform}`)
    }

    const execPath = path.resolve(platformInfo.exec)

    console.log(`Running plugin: ${pluginInfo.name}`)
    console.log(`Executing: ${execPath}`)

    const child = spawn(execPath, [...pluginInfo.desc['cliArgs']], {
      cwd: path.dirname(execPath),
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    child.stdout.on('data', (data) => console.log(`stdout: ${data}`))
    child.stderr.on('data', (data) => console.error(`stderr: ${data}`))

    child.on('close', (code) => console.log(`child process exited with code ${code}`))
    child.on('exit', () => {
      const index = this.pluginProcess.findIndex((el) => el.pid === child.pid)
      if (index > -1) this.pluginProcess.splice(index, 1)
    })

    this.pluginProcess.push({ name: pluginInfo.name, pid: child.pid })
  }

  public async stopTask(pluginInfo: PluginInfo) {
    const index = this.pluginProcess.findIndex((el) => el.name === pluginInfo.name)
    if (index > -1) {
      await this.killProcess(this.pluginProcess[index].pid!)
      this.pluginProcess.splice(index, 1)
    }
  }

  public checkPluginStatus(name: string): boolean {
    const p = this.pluginProcess.find((el) => el.name === name)
    if (!p) return false
    return this.isProcessAlive(p.pid!)
  }

  public async stopAllTasks() {
    for (const p of this.pluginProcess) {
      await this.killProcess(p.pid!)
    }
    this.pluginProcess = []
  }
}

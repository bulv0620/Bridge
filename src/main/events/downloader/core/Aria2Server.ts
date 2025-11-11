import { parseConfFile, writeConfFile } from '../../../utils/confUtils'
import { getPlugin, getPluginConfPath, runTask } from '../../../utils/pluginUtils'

export class Aria2Server {
  private ariaPlugin: PluginInfo = getPlugin('aria2')!

  constructor() {
    runTask(this.ariaPlugin)
  }

  getAria2Settings() {
    const path = getPluginConfPath(this.ariaPlugin)
    return parseConfFile(path).data
  }

  saveAria2Settings(settings: Aria2GlobalOption) {
    const path = getPluginConfPath(this.ariaPlugin)

    return writeConfFile(path, settings)
  }
}

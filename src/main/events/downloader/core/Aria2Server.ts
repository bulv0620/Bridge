import { getPlugin, runTask } from '../../../utils/PluginManager'

export class Aria2Server {
  private ariaPlugin: PluginInfo = getPlugin('aria2')!

  constructor() {
    runTask(this.ariaPlugin)
  }
}

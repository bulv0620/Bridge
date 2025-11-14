import { type App } from 'vue'
import { dialogDrag } from './dialog-drag'

/** 挂载自定义指令 */
export function loadDirectives(app: App) {
  app.directive('dialogDrag', dialogDrag)
}

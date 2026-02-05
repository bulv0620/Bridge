import { updateTray } from '../utils/tray'
import { getWindow } from '../utils/window'
import { updateMenu } from '../utils/menu'
import { remoteRef } from '../utils/remoteRef'
import { getStore } from '../store'

const store = getStore()

export const locale = remoteRef<Locales>('current-locale', store.get('locale'))

export function initLocleConfig() {
  locale.onUpdate(
    (lang) => {
      const mainWindow = getWindow('main')
      updateTray(lang, { mainWindow: mainWindow! })
      updateMenu(lang)
      store.set('locale', lang)
    },
    { immediate: true },
  )
}

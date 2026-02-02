import { updateTray } from '../utils/tray'
import { getWindow } from '../utils/window'
import { updateMenu } from '../utils/menu'
import { remoteRef } from '../utils/remoteRef'
import { getStore } from '../store'

const store = getStore()

const locale = remoteRef<Locales>('current-locale', store.get('locale'))

const mainWindow = getWindow('main')
updateTray(locale.value, { mainWindow: mainWindow! })

locale.onUpdate((lang) => {
  updateTray(lang, { mainWindow: mainWindow! })
  updateMenu(lang)
  store.set('locale', lang)
})

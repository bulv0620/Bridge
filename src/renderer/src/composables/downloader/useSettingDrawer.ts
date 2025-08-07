import { ref, reactive } from 'vue'
import { Aria2Client } from '@renderer/utils/aria2/Aria2Client'
import { useAria2 } from '@renderer/composables/downloader/useAria2'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'

const ipcRenderer = window.electron.ipcRenderer

const { t } = i18n.global
const { message } = useDiscreteApi()
const { aria2, testConnection } = useAria2()

const showSettingDrawer = ref(false)
const activeTab = ref('connection')

const connectionForm = reactive({
  host: 'http://localhost:6800/jsonrpc',
  token: '',
})

const connecting = ref(false)
const applyingSettings = ref(false)
const fetchingTracker = ref(false)

const settingsForm = reactive({
  dir: '',
  maxConcurrentDownloads: 5,
  split: 5,
  maxConnectionPerServer: 4,
  maxOverallDownloadLimit: 0,
  maxOverallUploadLimit: 0,
  enableDHT: true,
  btTracker: '',

  // other settings
  enableUrlWatcher: false,
})

async function connectToAria2() {
  connecting.value = true
  try {
    aria2.value = new Aria2Client({ url: connectionForm.host, token: connectionForm.token })
    await testConnection()
    message.success(t('views.downloader.connectSuccess'))
    await loadSettings()
    activeTab.value = 'settings'
  } catch (err: any) {
    message.error(t('views.downloader.connectFail') + `: ${err.message}`)
  } finally {
    connecting.value = false
  }
}

async function loadSettings() {
  if (!aria2.value) return
  const options = await aria2.value.getGlobalOption()
  settingsForm.dir = options.dir
  settingsForm.maxConcurrentDownloads = parseInt(options['max-concurrent-downloads'])
  settingsForm.split = parseInt(options['split'])
  settingsForm.maxConnectionPerServer = parseInt(options['max-connection-per-server'])
  settingsForm.maxOverallDownloadLimit = parseInt(options['max-overall-download-limit'])
  settingsForm.maxOverallUploadLimit = parseInt(options['max-overall-upload-limit'])
  settingsForm.enableDHT = options['enable-dht'] === 'true'
  settingsForm.btTracker = options['bt-tracker'] || ''
}

async function loadLocalSettings() {
  settingsForm.enableUrlWatcher = await ipcRenderer.invoke('get-clipboard-watcher-status')
}

async function applySettings() {
  if (!aria2.value) return
  applyingSettings.value = true
  try {
    await aria2.value.changeGlobalOption({
      dir: settingsForm.dir,
      'max-concurrent-downloads': String(settingsForm.maxConcurrentDownloads),
      split: String(settingsForm.split),
      'max-connection-per-server': String(settingsForm.maxConnectionPerServer),
      'max-overall-download-limit': String(settingsForm.maxOverallDownloadLimit),
      'max-overall-upload-limit': String(settingsForm.maxOverallUploadLimit),
      'enable-dht': settingsForm.enableDHT ? 'true' : 'false',
      'bt-tracker': settingsForm.btTracker.trim(),
    })
    message.success(t('views.downloader.applySuccess'))
  } catch (err: any) {
    message.error(t('views.downloader.applyFail') + `: ${err.message}`)
  } finally {
    applyingSettings.value = false
  }
}

async function fetchLatestTracker() {
  fetchingTracker.value = true
  try {
    const res = await fetch('https://cf.trackerslist.com/best_aria2.txt')
    const text = await res.text()
    settingsForm.btTracker = text.replace(/\n+/g, ',')
    message.success(t('views.downloader.trackerSuccess'))
  } catch (err: any) {
    message.error(t('views.downloader.trackerFail') + `: ${err.message}`)
  } finally {
    fetchingTracker.value = false
  }
}

async function selectFolder() {
  const path = await ipcRenderer.invoke('select-folder')
  if (path) {
    settingsForm.dir = path
  }
}

export function useSettingDrawer() {
  return {
    showSettingDrawer,
    activeTab,
    connectionForm,
    connecting,
    applyingSettings,
    fetchingTracker,
    settingsForm,
    connectToAria2,
    loadSettings,
    loadLocalSettings,
    applySettings,
    fetchLatestTracker,
    selectFolder,
  }
}

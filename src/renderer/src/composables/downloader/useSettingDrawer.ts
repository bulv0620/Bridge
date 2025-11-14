import { ref, toRaw } from 'vue'
import { useAria2 } from '@renderer/composables/downloader/useAria2'
import { i18n } from '@renderer/locales'
import { ElMessage } from 'element-plus'

const { t } = i18n.global
const { aria2 } = useAria2()

const showSettingDrawer = ref(false)
const activeTab = ref('settings')

const connecting = ref(false)
const applyingSettings = ref(false)
const fetchingTracker = ref(false)

const settingsForm = ref<Aria2GlobalOption>({
  dir: '',
  split: '',
  'max-concurrent-downloads': '',
  'max-connection-per-server': '',
  'max-overall-download-limit': '',
  'max-overall-upload-limit': '',
  'enable-dht': 'true',
  'bt-tracker': '',
})

const localSettingsForm = ref({
  enableUrlWatcher: false,
})

async function loadSettings() {
  if (!aria2.value) return
  const options = await aria2.value.getGlobalOption()
  settingsForm.value = options
}

async function loadLocalSettings() {
  localSettingsForm.value.enableUrlWatcher = await window.ipc.downloader.getMagnetWatcherStatus()
}

async function applySettings() {
  if (!aria2.value) return
  applyingSettings.value = true
  try {
    await aria2.value.changeGlobalOption(settingsForm.value)
    await window.ipc.downloader.saveSettings(toRaw(settingsForm.value))
    ElMessage.success(t('views.downloader.applySuccess'))
  } catch (err: any) {
    ElMessage.error(t('views.downloader.applyFail') + `: ${err.message}`)
  } finally {
    applyingSettings.value = false
  }
}

async function fetchLatestTracker() {
  fetchingTracker.value = true
  try {
    const res = await fetch('https://cf.trackerslist.com/best_aria2.txt')
    const text = await res.text()
    settingsForm.value['bt-tracker'] = text.replace(/\n+/g, ',')
    ElMessage.success(t('views.downloader.trackerSuccess'))
  } catch (err: any) {
    ElMessage.error(t('views.downloader.trackerFail') + `: ${err.message}`)
  } finally {
    fetchingTracker.value = false
  }
}

async function selectFolder() {
  const path = await window.ipc.file.selectFolder()
  if (path) {
    settingsForm.value.dir = path
  }
}

export function useSettingDrawer() {
  return {
    showSettingDrawer,
    activeTab,
    connecting,
    applyingSettings,
    fetchingTracker,
    settingsForm,
    localSettingsForm,
    loadSettings,
    loadLocalSettings,
    applySettings,
    fetchLatestTracker,
    selectFolder,
  }
}

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Aria2Client } from '@renderer/utils/aria2/request'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useAria2 } from '@renderer/composables/aria2'
import { FolderOutline } from '@vicons/ionicons5'

const ipcRenderer = window.electron.ipcRenderer

const showDrawer = defineModel<boolean>('show')
const message = useMessage()
const { t } = useI18n()

const { aria2, isConnected, testConnection } = useAria2()

const activeTab = ref('connection')

const connectionForm = reactive({
  host: 'http://localhost:6800/jsonrpc',
  token: '',
})

const connecting = ref(false)
const applyingSettings = ref(false)
const fetchingTracker = ref(false)

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

const settingsForm = reactive({
  dir: '',
  maxConcurrentDownloads: 5,
  split: 5,
  maxConnectionPerServer: 4,
  maxOverallDownloadLimit: 0,
  maxOverallUploadLimit: 0,
  enableDHT: true,
  btTracker: '',
})

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

watch(isConnected, (connected) => {
  if (!connected) {
    activeTab.value = 'connection'
  }
})

watch(activeTab, (tab) => {
  if (tab === 'settings') {
    loadSettings()
  }
})
</script>

<template>
  <n-drawer
    v-model:show="showDrawer"
    :width="520"
    placement="right"
    :trap-focus="false"
    :block-scroll="false"
    to="#setting-drawer-target"
  >
    <n-drawer-content :title="t('views.downloader.settingTitle')" :closable="true">
      <n-scrollbar style="height: 100%; width: calc(100% - 18px); padding-right: 18px">
        <n-tabs v-model:value="activeTab">
          <n-tab-pane name="connection" :tab="t('views.downloader.tabConnection')">
            <n-form label-placement="left" label-width="100">
              <n-form-item :label="t('views.downloader.rpcAddress')">
                <n-input
                  v-model:value="connectionForm.host"
                  placeholder="http://localhost:6800/jsonrpc"
                />
              </n-form-item>
              <n-form-item :label="t('views.downloader.token')">
                <n-input
                  v-model:value="connectionForm.token"
                  :placeholder="t('views.downloader.tokenPlaceholder')"
                />
              </n-form-item>
              <n-form-item>
                <n-button type="primary" :loading="connecting" @click="connectToAria2">
                  {{ t('views.downloader.connect') }}
                </n-button>
              </n-form-item>
            </n-form>
          </n-tab-pane>

          <n-tab-pane v-if="isConnected" name="settings" :tab="t('views.downloader.tabSettings')">
            <n-form label-placement="left" label-width="160">
              <n-form-item :label="t('views.downloader.dir')">
                <n-input-group>
                  <n-input v-model:value="settingsForm.dir" />
                  <n-button :loading="applyingSettings" @click="selectFolder">
                    <template #icon>
                      <n-icon> <FolderOutline /> </n-icon>
                    </template>
                  </n-button>
                </n-input-group>
              </n-form-item>
              <n-form-item :label="t('views.downloader.maxConcurrent')">
                <n-input-number
                  v-model:value="settingsForm.maxConcurrentDownloads"
                  style="width: 100%"
                  :min="1"
                  :max="64"
                />
              </n-form-item>
              <n-form-item :label="t('views.downloader.split')">
                <n-input-number
                  v-model:value="settingsForm.split"
                  style="width: 100%"
                  :min="1"
                  :max="64"
                />
              </n-form-item>
              <n-form-item :label="t('views.downloader.maxConnection')">
                <n-input-number
                  v-model:value="settingsForm.maxConnectionPerServer"
                  style="width: 100%"
                  :min="1"
                  :max="16"
                />
              </n-form-item>
              <n-form-item :label="t('views.downloader.downloadLimit')">
                <n-input-number
                  v-model:value="settingsForm.maxOverallDownloadLimit"
                  style="width: 100%"
                  :min="0"
                  :placeholder="t('views.downloader.noLimit')"
                />
              </n-form-item>
              <n-form-item :label="t('views.downloader.uploadLimit')">
                <n-input-number
                  v-model:value="settingsForm.maxOverallUploadLimit"
                  style="width: 100%"
                  :min="0"
                  :placeholder="t('views.downloader.noLimit')"
                />
              </n-form-item>
              <n-form-item :label="t('views.downloader.enableDHT')">
                <n-switch v-model:value="settingsForm.enableDHT" />
              </n-form-item>
              <n-form-item :label="t('views.downloader.btTracker')">
                <n-input
                  v-model:value="settingsForm.btTracker"
                  type="textarea"
                  :placeholder="t('views.downloader.trackerPlaceholder')"
                />
              </n-form-item>
              <n-form-item>
                <n-space>
                  <n-button type="primary" :loading="applyingSettings" @click="applySettings">
                    {{ t('views.downloader.apply') }}
                  </n-button>
                  <n-button tertiary :loading="fetchingTracker" @click="fetchLatestTracker">
                    {{ t('views.downloader.fetchTracker') }}
                  </n-button>
                </n-space>
              </n-form-item>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-scrollbar>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped></style>

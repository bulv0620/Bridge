<script setup lang="ts">
import { FolderOutline } from '@vicons/ionicons5'
import { useSettingDrawer } from '@renderer/composables/downloader/useSettingDrawer'
import { useAria2 } from '@renderer/composables/downloader/useAria2'
import { watch } from 'vue'

const { aria2, isConnected } = useAria2()

const {
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
} = useSettingDrawer()

watch(isConnected, (connected) => {
  if (!connected) {
    activeTab.value = 'connection'

    window.ipc.clipboard.stopMagnetWatcher()
  }
})

watch(activeTab, (tab) => {
  if (tab === 'settings') {
    loadSettings()
  }
  if (tab === 'localSettings') {
    loadLocalSettings()
  }
})

watch(showSettingDrawer, (show) => {
  if (show) {
    if (activeTab.value === 'settings') {
      loadSettings()
    }
    if (activeTab.value === 'localSettings') {
      loadLocalSettings()
    }
  }
})

watch(
  () => settingsForm.enableUrlWatcher,
  (enable) => {
    if (enable) {
      window.ipc.clipboard.startMagnetWatcher()
    } else {
      window.ipc.clipboard.stopMagnetWatcher()
    }
  },
)
</script>

<template>
  <n-drawer
    v-model:show="showSettingDrawer"
    :width="520"
    placement="right"
    :trap-focus="false"
    :block-scroll="false"
    to="#downloader-drawer-target"
  >
    <n-drawer-content :title="$t('views.downloader.settingTitle')" :closable="true">
      <n-scrollbar style="height: 100%; width: calc(100% - 18px); padding-right: 18px">
        <n-tabs v-model:value="activeTab">
          <n-tab-pane name="connection" :tab="$t('views.downloader.tabConnection')">
            <n-form label-placement="left" label-width="100">
              <n-form-item :label="$t('views.downloader.rpcAddress')">
                <n-input
                  v-model:value="connectionForm.host"
                  placeholder="http://localhost:6800/jsonrpc"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.token')">
                <n-input
                  v-model:value="connectionForm.token"
                  :placeholder="$t('views.downloader.tokenPlaceholder')"
                />
              </n-form-item>
              <n-form-item>
                <n-button type="primary" :loading="connecting" @click="connectToAria2">
                  {{ $t('views.downloader.connect') }}
                </n-button>
              </n-form-item>
            </n-form>
          </n-tab-pane>

          <n-tab-pane v-if="isConnected" name="settings" :tab="$t('views.downloader.tabSettings')">
            <n-form label-placement="left" label-width="160">
              <n-form-item :label="$t('views.downloader.dir')">
                <n-input-group>
                  <n-input v-model:value="settingsForm.dir" />
                  <n-button
                    v-if="
                      aria2?.getUrl().includes('localhost') || aria2?.getUrl().includes('127.0.0.1')
                    "
                    :loading="applyingSettings"
                    @click="selectFolder"
                  >
                    <template #icon>
                      <n-icon> <FolderOutline /> </n-icon>
                    </template>
                  </n-button>
                </n-input-group>
              </n-form-item>
              <n-form-item :label="$t('views.downloader.maxConcurrent')">
                <n-input-number
                  v-model:value="settingsForm.maxConcurrentDownloads"
                  style="width: 100%"
                  :min="1"
                  :max="64"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.split')">
                <n-input-number
                  v-model:value="settingsForm.split"
                  style="width: 100%"
                  :min="1"
                  :max="64"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.maxConnection')">
                <n-input-number
                  v-model:value="settingsForm.maxConnectionPerServer"
                  style="width: 100%"
                  :min="1"
                  :max="16"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.downloadLimit')">
                <n-input-number
                  v-model:value="settingsForm.maxOverallDownloadLimit"
                  style="width: 100%"
                  :min="0"
                  :placeholder="$t('views.downloader.noLimit')"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.uploadLimit')">
                <n-input-number
                  v-model:value="settingsForm.maxOverallUploadLimit"
                  style="width: 100%"
                  :min="0"
                  :placeholder="$t('views.downloader.noLimit')"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.enableDHT')">
                <n-switch v-model:value="settingsForm.enableDHT" />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.btTracker')">
                <n-input
                  v-model:value="settingsForm.btTracker"
                  type="textarea"
                  :placeholder="$t('views.downloader.trackerPlaceholder')"
                />
              </n-form-item>
              <n-form-item>
                <n-space>
                  <n-button type="primary" :loading="applyingSettings" @click="applySettings">
                    {{ $t('views.downloader.apply') }}
                  </n-button>
                  <n-button tertiary :loading="fetchingTracker" @click="fetchLatestTracker">
                    {{ $t('views.downloader.fetchTracker') }}
                  </n-button>
                </n-space>
              </n-form-item>
            </n-form>
          </n-tab-pane>

          <n-tab-pane
            v-if="
              (isConnected && aria2?.getUrl().includes('localhost')) ||
              aria2?.getUrl().includes('127.0.0.1')
            "
            name="localSettings"
            :tab="$t('views.downloader.tabLocalSettings')"
          >
            <n-form label-placement="left" label-width="150">
              <n-form-item :label="$t('views.downloader.enableUrlWatcher')">
                <n-switch v-model:value="settingsForm.enableUrlWatcher" />
              </n-form-item>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-scrollbar>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped></style>

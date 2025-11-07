<script setup lang="ts">
import { FolderOutline } from '@vicons/ionicons5'
import { useSettingDrawer } from '@renderer/composables/downloader/useSettingDrawer'
import { watch } from 'vue'

const {
  showSettingDrawer,
  activeTab,
  applyingSettings,
  fetchingTracker,
  settingsForm,
  localSettingsForm,
  loadSettings,
  loadLocalSettings,
  applySettings,
  fetchLatestTracker,
  selectFolder,
} = useSettingDrawer()

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
  () => localSettingsForm.value.enableUrlWatcher,
  (enable) => {
    if (enable) {
      window.ipc.downloader.startMagnetWatcher()
    } else {
      window.ipc.downloader.stopMagnetWatcher()
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
          <n-tab-pane name="settings" :tab="$t('views.downloader.tabSettings')">
            <n-form label-placement="left" label-width="160">
              <n-form-item :label="$t('views.downloader.dir')">
                <n-input-group>
                  <n-input v-model:value="settingsForm['dir']" />
                  <n-button :loading="applyingSettings" @click="selectFolder">
                    <template #icon>
                      <n-icon> <FolderOutline /> </n-icon>
                    </template>
                  </n-button>
                </n-input-group>
              </n-form-item>
              <n-form-item :label="$t('views.downloader.maxConcurrent')">
                <n-input
                  v-model:value="settingsForm['max-concurrent-downloads']"
                  style="width: 100%"
                  type="number"
                  :input-props="{ min: 1, max: 64 }"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.split')">
                <n-input
                  v-model:value="settingsForm['split']"
                  style="width: 100%"
                  type="number"
                  :input-props="{ min: 1, max: 64 }"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.maxConnection')">
                <n-input
                  v-model:value="settingsForm['max-connection-per-server']"
                  style="width: 100%"
                  type="number"
                  :input-props="{ min: 1, max: 16 }"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.downloadLimit')">
                <n-input
                  v-model:value="settingsForm['max-overall-download-limit']"
                  style="width: 100%"
                  type="number"
                  :input-props="{ min: 0 }"
                  :placeholder="$t('views.downloader.noLimit')"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.uploadLimit')">
                <n-input
                  v-model:value="settingsForm['max-overall-upload-limit']"
                  style="width: 100%"
                  type="number"
                  :input-props="{ min: 0 }"
                  :placeholder="$t('views.downloader.noLimit')"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.enableDHT')">
                <n-switch
                  v-model:value="settingsForm['enable-dht']"
                  checked-value="true"
                  unchecked-value="false"
                />
              </n-form-item>
              <n-form-item :label="$t('views.downloader.btTracker')">
                <n-input
                  v-model:value="settingsForm['bt-tracker']"
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

          <n-tab-pane name="localSettings" :tab="$t('views.downloader.tabLocalSettings')">
            <n-form label-placement="left" label-width="150">
              <n-form-item :label="$t('views.downloader.enableUrlWatcher')">
                <n-switch v-model:value="localSettingsForm.enableUrlWatcher" />
              </n-form-item>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-scrollbar>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped></style>

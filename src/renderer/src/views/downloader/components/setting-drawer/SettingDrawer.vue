<script setup lang="ts">
import { Folder as FolderIcon } from '@element-plus/icons-vue'
import { watch } from 'vue'
import { useSettingDrawer } from '@renderer/composables/downloader/useSettingDrawer'

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
  if (tab === 'settings') loadSettings()
  if (tab === 'localSettings') loadLocalSettings()
})

watch(showSettingDrawer, (show) => {
  if (show) {
    if (activeTab.value === 'settings') loadSettings()
    if (activeTab.value === 'localSettings') loadLocalSettings()
  }
})

watch(
  () => localSettingsForm.value.enableUrlWatcher,
  (enable) => {
    if (enable) window.ipc.downloader.startMagnetWatcher()
    else window.ipc.downloader.stopMagnetWatcher()
  },
)
</script>

<template>
  <!-- Element Plus Drawer -->
  <el-drawer
    v-model="showSettingDrawer"
    size="520px"
    direction="rtl"
    :destroy-on-close="false"
    :modal="true"
    append-to-body
  >
    <template #header>
      <span>{{ $t('views.downloader.settingTitle') }}</span>
    </template>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="drawer-tabs" style="height: 100%">
      <!-- ========== 远程 aria2 配置 ========== -->
      <el-tab-pane :label="$t('views.downloader.tabSettings')" name="settings" style="height: 100%">
        <div class="setting-wrapper">
          <div class="setting-form">
            <el-scrollbar height="100%">
              <el-form label-width="auto" label-position="top" class="form">
                <el-form-item :label="$t('views.downloader.dir')">
                  <el-input
                    v-model="settingsForm['dir']"
                    style="width: 100%"
                    readonly
                    :suffix-icon="FolderIcon"
                    @click="selectFolder"
                  >
                  </el-input>
                </el-form-item>

                <el-form-item :label="$t('views.downloader.maxConcurrent')">
                  <el-input
                    v-model="settingsForm['max-concurrent-downloads']"
                    type="number"
                    min="1"
                    max="64"
                  />
                </el-form-item>

                <el-form-item :label="$t('views.downloader.split')">
                  <el-input v-model="settingsForm.split" type="number" min="1" max="64" />
                </el-form-item>

                <el-form-item :label="$t('views.downloader.maxConnection')">
                  <el-input
                    v-model="settingsForm['max-connection-per-server']"
                    type="number"
                    min="1"
                    max="16"
                  />
                </el-form-item>

                <el-form-item :label="$t('views.downloader.downloadLimit')">
                  <el-input
                    v-model="settingsForm['max-overall-download-limit']"
                    type="number"
                    min="0"
                    :placeholder="$t('views.downloader.noLimit')"
                  />
                </el-form-item>

                <el-form-item :label="$t('views.downloader.uploadLimit')">
                  <el-input
                    v-model="settingsForm['max-overall-upload-limit']"
                    type="number"
                    min="0"
                    :placeholder="$t('views.downloader.noLimit')"
                  />
                </el-form-item>

                <el-form-item :label="$t('views.downloader.enableDHT')">
                  <el-switch
                    v-model="settingsForm['enable-dht']"
                    active-value="true"
                    inactive-value="false"
                  />
                </el-form-item>

                <el-form-item :label="$t('views.downloader.btTracker')">
                  <el-input
                    v-model="settingsForm['bt-tracker']"
                    type="textarea"
                    :placeholder="$t('views.downloader.trackerPlaceholder')"
                    :rows="4"
                  />
                </el-form-item>
              </el-form>
            </el-scrollbar>
          </div>

          <div class="btn-row">
            <el-button type="primary" :loading="applyingSettings" @click="applySettings">
              {{ $t('views.downloader.apply') }}
            </el-button>
            <el-button :loading="fetchingTracker" @click="fetchLatestTracker">
              {{ $t('views.downloader.fetchTracker') }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- ========== 本地设置 ========== -->
      <el-tab-pane :label="$t('views.downloader.tabLocalSettings')" name="localSettings">
        <el-form label-width="150px">
          <el-form-item :label="$t('views.downloader.enableUrlWatcher')">
            <el-switch v-model="localSettingsForm.enableUrlWatcher" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<style scoped lang="less">
.setting-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;

  .setting-form {
    flex: 1;
    overflow: auto;
  }
}

.btn-row {
  display: flex;
  gap: 12px;
}
</style>

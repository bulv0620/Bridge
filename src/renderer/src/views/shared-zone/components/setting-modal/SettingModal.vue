<script setup lang="ts">
import { useSettingModal } from '@renderer/composables/share-zone/useSettingModal'

const { visible, configForm, confirm } = useSettingModal()
</script>

<template>
  <CommonDialog
    v-model:visible="visible"
    :title="$t('views.sharedZone.settingTitle')"
    width="400px"
    :on-confirm="confirm"
  >
    <div class="settings-container">
      <div class="setting-item">
        <div class="label">
          <span class="title">{{ $t('views.sharedZone.lanDiscoverable') }}</span>
          <p class="desc">{{ $t('views.sharedZone.lanDiscoverableDesc') }}</p>
        </div>
        <el-switch v-model="configForm.lanDiscoverable" />
      </div>

      <hr v-if="configForm.lanDiscoverable" class="divider" />

      <div v-if="configForm.lanDiscoverable" class="setting-item">
        <div class="label">
          <span class="title">{{ $t('views.sharedZone.filePush') }}</span>
          <p class="desc">{{ $t('views.sharedZone.filePushDesc') }}</p>
        </div>
        <el-switch v-model="configForm.filePushEnabled" />
      </div>

      <div v-if="configForm.lanDiscoverable" class="setting-item">
        <div class="label">
          <span class="title">{{ $t('views.sharedZone.clipboardShare') }}</span>
          <p class="desc">{{ $t('views.sharedZone.clipboardShareDesc') }}</p>
        </div>
        <el-switch v-model="configForm.clipboardEnabled" />
      </div>
    </div>
  </CommonDialog>
</template>

<style scoped>
.settings-container {
  padding: 0 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-weight: 500;
  font-size: 14px;
}

.desc {
  font-size: 12px;
  color: #888;
  margin: 0;
}

.divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 8px 0;
}
</style>

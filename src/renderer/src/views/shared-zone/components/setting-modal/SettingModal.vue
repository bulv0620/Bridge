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
          <span class="title">{{ $t('views.sharedZone.lanDiscovery') }}</span>
          <p class="desc">{{ $t('views.sharedZone.lanDiscoveryDesc') }}</p>
        </div>
        <el-switch v-model="configForm.lanDiscovery" />
      </div>

      <div v-if="configForm.lanDiscovery" class="setting-item">
        <div class="label">
          <span class="title">{{ $t('views.sharedZone.filePush') }}</span>
          <p class="desc">{{ $t('views.sharedZone.filePushDesc') }}</p>
        </div>
        <el-switch v-model="configForm.filePushEnabled" />
      </div>

      <div v-if="configForm.lanDiscovery" class="setting-item">
        <div class="label">
          <span class="title">{{ $t('views.sharedZone.clipboardShare') }}</span>
          <p class="desc">{{ $t('views.sharedZone.clipboardShareDesc') }}</p>
        </div>
        <el-switch v-model="configForm.clipboardEnabled" />
      </div>
    </div>
  </CommonDialog>
</template>

<style scoped lang="less">
.settings-container {
  padding: 2px 4px 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item {
  min-height: 54px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--bridge-surface-soft);
  box-shadow: inset 0 0 0 1px var(--bridge-stroke);
}

.label {
  min-width: 0;
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
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  margin: 0;
}
</style>

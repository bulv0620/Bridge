<script setup lang="ts">
import { useSettingDrawer } from '@renderer/composables/share-hub/useSettingDrawer'
import { TrashBinOutline } from '@vicons/ionicons5'
import { FileDownloadOutlined, FileUploadOutlined } from '@vicons/material'

const { settingsForm } = useSettingDrawer()
</script>

<template>
  <n-space>
    <CommonButton
      :tooltip="$t('views.shareHub.upload')"
      :icon="FileUploadOutlined"
      :button-props="{ size: 'small', circle: true, type: 'primary' }"
      placement="bottom"
      :delay="500"
    />
    <CommonButton
      :tooltip="$t('views.shareHub.download')"
      :icon="FileDownloadOutlined"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
    />
    <CommonButton
      :tooltip="$t('views.shareHub.remove')"
      :icon="TrashBinOutline"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
    />
  </n-space>
  <n-space>
    <n-form-item
      :label="$t('views.shareHub.enableSharing')"
      :show-feedback="false"
      label-placement="left"
      size="small"
    >
      <n-switch v-model:value="settingsForm.enableSharing" />
    </n-form-item>
    <n-form-item
      :label="$t('views.shareHub.showMyFiles')"
      :show-feedback="false"
      label-placement="left"
      size="small"
    >
      <n-switch v-model:value="settingsForm.showMyFiles" />
    </n-form-item>
  </n-space>
</template>

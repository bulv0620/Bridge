<script setup lang="ts">
import { SettingsOutline, TrashBinOutline } from '@vicons/ionicons5'
import { FileDownloadOutlined, FileUploadOutlined } from '@vicons/material'
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
  <CommonButton
    :tooltip="$t('views.shareHub.setting')"
    :icon="SettingsOutline"
    :button-props="{ size: 'small', circle: true }"
    placement="bottom"
    :delay="500"
  />
</template>

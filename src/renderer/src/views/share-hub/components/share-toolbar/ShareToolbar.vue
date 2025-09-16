<script setup lang="ts">
import { useSettingForm } from '@renderer/composables/share-hub/useSettingForm'

const { enableSharing, enableSharingLoading, showMyFiles, handleUpdateEnableSharing } =
  useSettingForm()

window.events.on('share:message', (message) => {
  console.log(message)
})
</script>

<template>
  <n-form-item
    :label="$t('views.shareHub.enableSharing')"
    :show-feedback="false"
    label-placement="left"
    size="small"
  >
    <n-switch
      :rubber-band="false"
      :value="enableSharing"
      :loading="enableSharingLoading"
      @update:value="handleUpdateEnableSharing"
    />
  </n-form-item>
  <n-form-item
    :label="$t('views.shareHub.showMyFiles')"
    :show-feedback="false"
    label-placement="left"
    size="small"
  >
    <n-switch v-model:value="showMyFiles" />
  </n-form-item>
</template>

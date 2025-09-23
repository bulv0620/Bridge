<script setup lang="ts">
import { useSettingForm } from '@renderer/composables/share-hub/useSettingForm'

const { enableSharing, enableSharingLoading, handleUpdateEnableSharing } = useSettingForm()

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
</template>

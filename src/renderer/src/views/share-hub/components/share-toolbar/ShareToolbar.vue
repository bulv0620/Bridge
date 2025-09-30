<script setup lang="ts">
import { useSharing } from '@renderer/composables/share-hub/useSharing'

const { enableSharing, enableSharingLoading, handleUpdateEnableSharing } = useSharing()
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

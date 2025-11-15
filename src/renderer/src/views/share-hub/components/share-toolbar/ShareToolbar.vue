<script setup lang="ts">
import { useSharing } from '@renderer/composables/share-hub/useSharing'

const { enableSharing, enableSharingLoading, handleUpdateEnableSharing } = useSharing()
</script>

<template>
  <el-form-item
    :label="$t('views.shareHub.enableSharing')"
    label-width="auto"
    style="margin-bottom: 0"
  >
    <el-switch
      :model-value="enableSharing"
      :loading="enableSharingLoading"
      @update:model-value="handleUpdateEnableSharing"
    />
  </el-form-item>
</template>

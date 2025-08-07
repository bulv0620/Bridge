<script setup lang="ts">
import { SwapHorizontal } from '@vicons/ionicons5'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { useFileDiff } from '@renderer/composables/file-sync/useFileDiff'
import { useFileSync } from '@renderer/composables/file-sync/useFileSync'

import FolderSelectionInput from '../folder-selection-input/FolderSelectionInput.vue'

defineOptions({
  name: 'FileSync',
})

const { sourceFolder, targetFolder } = useSyncForm()
const { diffLoading, startDiff } = useFileDiff()
const { processing } = useFileSync()
</script>

<template>
  <n-flex :wrap="false">
    <FolderSelectionInput
      v-model:value="sourceFolder"
      type="source"
      :processing="processing"
    ></FolderSelectionInput>

    <CommonButton
      :loading="diffLoading"
      :tooltip="$t('views.fileSync.contrast')"
      :icon="SwapHorizontal"
      :button-props="{ circle: true }"
      placement="bottom"
      :delay="500"
      :disabled="!sourceFolder.path || !targetFolder.path || processing"
      @click="startDiff"
    />

    <FolderSelectionInput
      v-model:value="targetFolder"
      type="target"
      :processing="processing"
    ></FolderSelectionInput>
  </n-flex>
</template>

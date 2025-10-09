<script setup lang="ts">
import { TrashBinOutline } from '@vicons/ionicons5'
import { ref, toRaw } from 'vue'

const props = defineProps<{
  fileItem: SharedFileInfo
}>()

const loading = ref(false)

function handleUnshare() {
  loading.value = true
  window.ipc.share.removeFile(toRaw(props.fileItem))
}
</script>

<template>
  <CommonButton
    tooltip="取消共享"
    :icon="TrashBinOutline"
    :button-props="{ size: 'small', circle: true, secondary: true }"
    placement="bottom"
    :delay="500"
    :loading="loading"
    @click="handleUnshare"
  />
</template>

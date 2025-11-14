<script setup lang="ts">
import { getFileIcon } from '@renderer/utils/get-file-icon'
import { computed } from 'vue'

const props = defineProps<{
  fileName: string
  isDirectory: boolean
}>()

const iconInfo = computed(() => {
  return getFileIcon(props.fileName, undefined, props.isDirectory)
})
</script>

<template>
  <div class="filename-content">
    <n-icon class="icon" :component="iconInfo.icon" :color="iconInfo.color" />
    <div style="flex: 1; overflow: hidden">
      <n-ellipsis class="name" style="width: 100%">{{ fileName }}</n-ellipsis>
    </div>
  </div>
</template>

<style lang="less" scoped>
.filename-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>

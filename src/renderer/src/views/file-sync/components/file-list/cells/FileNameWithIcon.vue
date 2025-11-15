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
    <el-icon class="icon" :color="iconInfo.color">
      <component :is="iconInfo.icon"></component>
    </el-icon>
    <div style="flex: 1; overflow: hidden; line-height: normal">
      <el-text truncated class="name" style="width: 100%">{{ fileName }}</el-text>
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

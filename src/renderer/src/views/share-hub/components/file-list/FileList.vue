<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useDropZone } from '@vueuse/core'
import DropZoneOverlay from '@renderer/components/DropZoneOverlay.vue'

const dropZoneRef = useTemplateRef('dropZoneRef')
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  multiple: true,
})

function onDrop(files: File[] | null) {
  if (files && files.length > 0) {
    // addShare(files)
  }
}
</script>

<template>
  <div ref="dropZoneRef" class="file-list">
    <DropZoneOverlay :show="isOverDropZone"></DropZoneOverlay>
  </div>
</template>

<style lang="less" scoped>
.file-list {
  flex: 1;
  overflow: auto;
  padding: 16px;
  position: relative;
}
.empty {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>

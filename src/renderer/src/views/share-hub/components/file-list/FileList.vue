<script setup lang="ts">
import { useTemplateRef } from 'vue'
import FileCard from '../file-card/FileCard.vue'
import { useSharedFileList } from '@renderer/composables/share-hub/useSharedFileList'
import { useDropZone } from '@vueuse/core'
import DropZoneOverlay from '@renderer/components/DropZoneOverlay.vue'

const { validSharedFileList, addShare } = useSharedFileList()

const dropZoneRef = useTemplateRef('dropZoneRef')
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  multiple: true,
})

function onDrop(files: File[] | null) {
  if (files && files.length > 0) {
    addShare(files)
  }
}
</script>

<template>
  <div ref="dropZoneRef" class="file-list">
    <DropZoneOverlay :show="isOverDropZone"></DropZoneOverlay>
    <n-scrollbar style="height: 100%">
      <n-grid
        v-if="validSharedFileList.length > 0"
        :x-gap="12"
        :y-gap="8"
        cols="2 s:3 m:4 xl:5"
        responsive="screen"
      >
        <n-grid-item v-for="(file, index) in validSharedFileList" :key="index">
          <FileCard :file="file"></FileCard>
        </n-grid-item>
      </n-grid>

      <n-empty v-else class="empty" :description="$t('views.shareHub.emptyText')"> </n-empty>
    </n-scrollbar>
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

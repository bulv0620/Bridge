<script setup lang="ts">
import { useSharing } from '@renderer/composables/share-hub/useSharing'
import FileItem from '../file-item/FileItem.vue'

const { myDevice } = useSharing()
</script>

<template>
  <n-card :title="$t('views.shareHub.myShared')" class="my-shared-list" size="small">
    <div class="my-shared-list__content">
      <n-scrollbar v-if="myDevice && myDevice.data.files.length > 0" style="height: 100%">
        <FileItem
          v-for="item in myDevice.data.files"
          :key="item.id"
          :file-item="item"
          mine
        ></FileItem>
      </n-scrollbar>
      <n-empty v-else class="empty" :description="$t('views.shareHub.noFiles')"></n-empty>
    </div>
  </n-card>
</template>

<style lang="less" scoped>
.my-shared-list {
  flex: 1;
  overflow: hidden;

  .my-shared-list__content {
    height: 100%;
    position: relative;

    .empty {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }
}
</style>

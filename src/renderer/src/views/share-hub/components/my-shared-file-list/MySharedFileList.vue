<script setup lang="ts">
import { useSharing } from '@renderer/composables/share-hub/useSharing'
import FileItem from '../file-item/FileItem.vue'
import { AlbumsOutline } from '@vicons/ionicons5'

const { mySharedFiles } = useSharing()
</script>

<template>
  <div class="box my-shared-list">
    <!-- 标题 -->
    <div class="box-header">
      {{ $t('views.shareHub.myShared') }}
    </div>

    <!-- 内容区域 -->
    <div class="box-content my-shared-list__content">
      <!-- 有内容 -->
      <el-scrollbar v-if="mySharedFiles.length > 0" height="100%">
        <FileItem v-for="item in mySharedFiles" :key="item.id" :file-item="item" mine />
      </el-scrollbar>

      <!-- 无内容 -->
      <el-empty v-else class="empty" :description="$t('views.shareHub.noFiles')">
        <template #image>
          <el-icon :size="48">
            <AlbumsOutline />
          </el-icon>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<style lang="less" scoped>
/* 外层容器 */
.box {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  overflow: hidden;
}

/* 头部 */
.box-header {
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
}

/* 内容区域 */
.box-content {
  flex: 1;
  overflow: hidden;
  padding: 8px;
}

/* 你原来的布局 */
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

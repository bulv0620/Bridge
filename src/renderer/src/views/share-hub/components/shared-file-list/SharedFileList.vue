<script setup lang="ts">
import FileItem from '../file-item/FileItem.vue'
import { LogoWindows } from '@vicons/ionicons5'

const mockFiles: SharedFileInfo[] = Array.from({ length: 2 }).map((_, i) => {
  const now = Date.now()
  const total = Math.floor(Math.random() * 10) + 1 // 总次数 1~10
  const remaining = Math.floor(Math.random() * total)

  const type = ['txt', 'jpg', 'mp4', 'pdf'][i % 4]

  return {
    id: `file-${i + 1}`,
    filePath: `/mock/path/file-${i + 1}.txt`,
    fileName: `file-${i + 1}.${type}`,
    type: type,
    size: Math.floor(Math.random() * 1024 * 1024), // 0~1MB 随机大小
    status: {
      remaining,
      total,
      createdAt: now,
      expiresAt: now + 1000 * 60 * 60 * 24 * (Math.floor(Math.random() * 7) + 1), // 1~7 天后过期
    },
  }
})
</script>

<template>
  <n-card :title="$t('views.shareHub.sharedFiles')" class="shared-list" size="small">
    <div class="shared-list__content">
      <n-scrollbar v-if="mockFiles.length > 0" style="height: 100%">
        <n-collapse>
          <n-collapse-item title="192.168.1.105" name="1">
            <FileItem v-for="item in mockFiles" :key="item.id" :file-item="item"></FileItem>
            <template #header-extra>
              <n-icon><LogoWindows></LogoWindows></n-icon>
            </template>
          </n-collapse-item>
          <n-collapse-item title="192.168.1.110" name="2">
            <FileItem v-for="item in mockFiles" :key="item.id" :file-item="item"></FileItem>
            <template #header-extra>
              <n-icon><LogoWindows></LogoWindows></n-icon>
            </template>
          </n-collapse-item>
        </n-collapse>
      </n-scrollbar>
      <n-empty v-else class="empty" :description="$t('views.shareHub.noFiles')"></n-empty>
    </div>
  </n-card>
</template>

<style lang="less" scoped>
.shared-list {
  height: 100%;

  .shared-list__content {
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

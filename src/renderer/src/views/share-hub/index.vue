<script setup lang="ts">
import { ref } from 'vue'
import ShareToolbar from './components/share-toolbar/ShareToolbar.vue'
import FileCard from './components/file-card/FileCard.vue'

defineOptions({
  name: 'ShareHub',
})

const mockFiles = ref([
  {
    uuid: 'f1a2b3c4d5',
    fileName: '项目计划书.pdf',
    fileSize: 5242880, // 5MB
    date: Date.now(),
    exp: Date.now() + 1 * 60 * 1000,
    consumableCount: 5,
  },
  {
    uuid: 'g6h7i8j9k0',
    fileName: '公司Logo.png',
    fileSize: 256000, // 250KB
    date: Date.now(),
    exp: Date.now() + 3 * 60 * 1000,
    consumableCount: 10,
  },
  {
    uuid: 'l1m2n3o4p5',
    fileName: '会议录音.mp3',
    fileSize: 10485760, // 10MB
    date: Date.now(),
    exp: Date.now() + 5 * 60 * 1000,
    consumableCount: 2,
  },
  {
    uuid: 'q6r7s8t9u0',
    fileName: '年度视频回顾.mp4',
    fileSize: 52428800, // 50MB
    date: Date.now(),
    exp: Date.now() + 3 * 60 * 1000,
    consumableCount: 1,
  },
  {
    uuid: 'v1w2x3y4z5',
    fileName: '项目压缩包.zip',
    fileSize: 104857600, // 100MB
    date: Date.now(),
    exp: Date.now() + 2 * 60 * 1000,
    consumableCount: 3,
  },
])
</script>

<template>
  <div class="shareHub">
    <div class="header">
      <ShareToolbar></ShareToolbar>
    </div>
    <n-divider style="margin: 0"></n-divider>
    <div class="main">
      <n-scrollbar style="height: 100%">
        <n-grid
          v-if="mockFiles.length > 0"
          :x-gap="12"
          :y-gap="8"
          cols="2 s:3 m:4 xl:5"
          responsive="screen"
        >
          <n-grid-item v-for="(file, index) in mockFiles" :key="index">
            <FileCard :file="file"></FileCard>
          </n-grid-item>
        </n-grid>

        <n-empty v-else class="empty" :description="$t('views.shareHub.emptyText')"> </n-empty>
      </n-scrollbar>
    </div>
    <n-divider style="margin: 0"></n-divider>
    <div class="footer">footer</div>
  </div>
</template>

<style lang="less" scoped>
.shareHub {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
  }

  .main {
    flex: 1;
    overflow: auto;
    padding: 16px;

    .empty {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .footer {
    padding: 16px;
  }
}
</style>

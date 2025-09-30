<script setup lang="ts">
import ShareToolbar from './components/share-toolbar/ShareToolbar.vue'
import { useSharing } from '@renderer/composables/share-hub/useSharing'
import NotEnabledWrapper from './components/not-enabled-wrapper/NotEnabledWrapper.vue'
import FileUploader from './components/file-uploader/FileUploader.vue'
import FileUploadModal from './components/file-upload-modal/FileUploadModal.vue'
import MySharedFileList from './components/my-shared-file-list/MySharedFileList.vue'
import SharedFileList from './components/shared-file-list/SharedFileList.vue'

defineOptions({
  name: 'ShareHub',
})

const { enableSharing } = useSharing()
</script>

<template>
  <div id="share-hub-drawer-target" class="shareHub">
    <div class="header">
      <ShareToolbar></ShareToolbar>
    </div>
    <n-divider style="margin: 0"></n-divider>

    <div v-if="enableSharing" class="main">
      <div class="left">
        <FileUploader></FileUploader>
        <MySharedFileList></MySharedFileList>
      </div>
      <div class="right">
        <SharedFileList></SharedFileList>
      </div>
    </div>
    <NotEnabledWrapper v-else> </NotEnabledWrapper>
  </div>
  <FileUploadModal></FileUploadModal>
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
    padding: 16px;
    flex: 1;
    overflow: hidden;
    display: flex;
    gap: 16px;

    .left {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .right {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>

<style>
.n-card > .n-card__content {
  overflow: hidden;
}
</style>

<script setup lang="ts">
import { UploadFilled, Close } from '@element-plus/icons-vue'
import { useFile } from '@renderer/composables/share-zone/useFile'

const { file } = useFile()

function onFileChange(uploadFile: any) {
  file.value = uploadFile.raw
}

function removeFile() {
  file.value = null
}
</script>

<template>
  <div class="upload">
    <el-upload
      class="upload-comp"
      drag
      :auto-upload="false"
      :show-file-list="false"
      :on-change="onFileChange"
    >
      <el-icon class="upload-icon"><UploadFilled /></el-icon>
      <div class="el-upload__text">
        {{ $t('views.sharedZone.uploadHint') }}
      </div>
    </el-upload>
    <div v-if="file" class="file-preview">
      <div class="text">{{ $t('views.sharedZone.selected') }}: {{ file.name }}</div>
      <div class="close-button">
        <el-button :icon="Close" link type="danger" @click="removeFile"></el-button>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.upload {
  height: 100%;
  flex: 1;
  overflow: hidden;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;

  .upload-comp {
    flex: 1;
    overflow: hidden;

    :deep(.el-upload) {
      height: 100%;
    }

    :deep(.el-upload-dragger) {
      height: 100%;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .upload-icon {
      font-size: 48px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 8px;
    }

    .el-upload__text {
      color: var(--el-text-color-placeholder);
    }
  }

  .file-preview {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 6px;

    .text {
      color: var(--el-color-primary);
      font-weight: 500;
      font-size: 14px;
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}
</style>

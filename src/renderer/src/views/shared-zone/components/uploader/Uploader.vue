<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'

const file = ref<File | null>(null)

function onFileChange(uploadFile: any) {
  file.value = uploadFile.raw
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
      {{ $t('views.sharedZone.selected') }}: {{ file.name }}
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
    color: var(--el-color-primary);
    font-weight: 500;
    font-size: 14px;
  }
}
</style>

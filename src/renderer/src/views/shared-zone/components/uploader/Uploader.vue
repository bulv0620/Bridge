<script setup lang="ts">
import { UploadFilled, Close, Document } from '@element-plus/icons-vue'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'
import { formatBytes } from '@renderer/utils/format'

const { file } = useTaskList()

function onFileChange(uploadFile: any) {
  file.value = uploadFile.raw
}

function removeFile() {
  file.value = null
}
</script>

<template>
  <section class="upload-panel" :class="{ 'has-file': file }">
    <div v-if="file" class="file-summary">
      <span class="file-icon">
        <el-icon><Document /></el-icon>
      </span>
      <div class="file-info">
        <strong :title="file.name">{{ file.name }}</strong>
        <span>{{ formatBytes(file.size) }}</span>
      </div>
      <el-button
        :icon="Close"
        circle
        text
        :title="$t('views.sharedZone.removeSelectedFile')"
        :aria-label="$t('views.sharedZone.removeSelectedFile')"
        @click="removeFile"
      />
    </div>

    <el-upload
      v-else
      class="upload-comp"
      drag
      :auto-upload="false"
      :show-file-list="false"
      :on-change="onFileChange"
    >
      <span class="upload-icon">
        <el-icon><UploadFilled /></el-icon>
      </span>
      <strong>{{ $t('views.sharedZone.chooseFile') }}</strong>
      <span class="upload-hint">{{ $t('views.sharedZone.dragFileHint') }}</span>
    </el-upload>
  </section>
</template>

<style lang="less" scoped>
.upload-panel {
  min-height: 0;
  flex: 1;
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;

  &.has-file {
    min-height: 72px;
    flex: 0 0 72px;
  }

  .upload-comp {
    min-height: 0;
    flex: 1;
    overflow: hidden;

    :deep(.el-upload) {
      height: 100%;
    }

    :deep(.el-upload-dragger) {
      height: 100%;
      min-height: 180px;
      padding: 20px;
      border: 1px dashed var(--el-border-color);
      border-radius: var(--bridge-radius-md);
      background: color-mix(in srgb, var(--bridge-surface) 76%, transparent);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition:
        border-color var(--bridge-motion),
        background var(--bridge-motion);

      &:hover {
        border-color: var(--el-color-primary-light-5);
        background: var(--el-color-primary-light-9);
      }
    }

    .upload-icon {
      width: 44px;
      height: 44px;
      margin-bottom: 12px;
      border-radius: 13px;
      display: grid;
      place-items: center;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);

      .el-icon {
        font-size: 23px;
      }
    }

    strong {
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 600;
    }

    .upload-hint {
      margin-top: 5px;
      color: var(--el-text-color-placeholder);
      font-size: 12px;
    }
  }

  .file-summary {
    height: 56px;
    margin: 8px;
    padding: 6px 8px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 10px;
    background: var(--bridge-surface);
    box-shadow: inset 0 0 0 1px var(--bridge-stroke);

    .file-icon {
      width: 34px;
      height: 34px;
      flex: none;
      border-radius: 9px;
      display: grid;
      place-items: center;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .file-info {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;

      strong {
        overflow: hidden;
        color: var(--el-text-color-primary);
        font-size: 13px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      span {
        margin-top: 2px;
        color: var(--el-text-color-secondary);
        font: 11px/1.3 monospace;
      }
    }
  }
}
</style>

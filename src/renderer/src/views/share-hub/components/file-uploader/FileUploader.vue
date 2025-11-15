<script setup lang="ts">
import { useUpload } from '@renderer/composables/share-hub/useUpload'
import { ArchiveOutline as ArchiveIcon } from '@vicons/ionicons5'
import type { UploadRequestOptions } from 'element-plus'

const { openUploadModal } = useUpload()

function customRequest(options: UploadRequestOptions) {
  const { file } = options

  const raw = file

  const fileInfo: SharedFileInfo = {
    id: raw.uid.toString(),
    filePath: raw.path,
    fileName: raw.name,
    type: raw.type,
    size: raw.size,
    status: {
      remaining: 1,
      total: 3,
      createdAt: Date.now(),
      expiresAt: undefined,
      expireType: '5min',
    },
  }

  openUploadModal(fileInfo)
}
</script>

<template>
  <el-upload
    class="upload-dragger"
    drag
    :http-request="customRequest"
    :show-file-list="false"
    :multiple="false"
  >
    <div class="el-upload-dragger-inner">
      <el-icon :size="42" style="margin-bottom: 12px; color: var(--el-text-color-secondary)">
        <ArchiveIcon />
      </el-icon>

      <span style="font-size: 16px; color: var(--el-text-color-secondary)">
        {{ $t('views.shareHub.uploadTip') }}
      </span>
    </div>
  </el-upload>
</template>

<style scoped>
.upload-dragger {
  width: 100%;
}
.el-upload-dragger-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>

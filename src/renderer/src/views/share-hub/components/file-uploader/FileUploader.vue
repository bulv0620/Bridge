<script setup lang="ts">
import { useUpload } from '@renderer/composables/share-hub/useUpload'
import { ArchiveOutline as ArchiveIcon } from '@vicons/ionicons5'
import { UploadCustomRequestOptions } from 'naive-ui'

const { openUploadModal } = useUpload()

function customRequest({ file, onFinish }: UploadCustomRequestOptions) {
  const fileInfo: SharedFileInfo = {
    id: file.id,
    filePath: file.file!.path,
    fileName: file.name,
    type: file.type!,
    size: file.file!.size,
    status: {
      remaining: 1,
      total: 3,
      createdAt: new Date().getTime(),
      expiresAt: undefined,
      expireType: '5min',
    },
  }

  openUploadModal(fileInfo)
  onFinish()
}
</script>

<template>
  <n-upload :custom-request="customRequest" :show-file-list="false">
    <n-upload-dragger>
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <ArchiveIcon />
        </n-icon>
      </div>
      <n-text :depth="3" style="font-size: 16px"> {{ $t('views.shareHub.uploadTip') }} </n-text>
    </n-upload-dragger>
  </n-upload>
</template>

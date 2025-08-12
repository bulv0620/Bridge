<script setup lang="ts">
import { useFileToolbar } from '@renderer/composables/ftp-client/useFileToolbar'
import { Refresh, FolderOutline, TrashBinOutline } from '@vicons/ionicons5'
import { FileDownloadOutlined, FileUploadOutlined } from '@vicons/material'

const {
  fileListLoading,
  uploadLoading,
  getFiles,
  handleOpenDownload,
  handleOpenUpload,
  handleCreateFolder,
  handleDeleteCheckedItem,
} = useFileToolbar()
</script>

<template>
  <n-space>
    <CommonButton
      :tooltip="$t('views.ftpClient.download')"
      :icon="FileDownloadOutlined"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      @click="handleOpenDownload"
    />
    <CommonButton
      :tooltip="$t('views.ftpClient.upload')"
      :icon="FileUploadOutlined"
      :button-props="{ size: 'small', circle: true }"
      :loading="uploadLoading"
      placement="bottom"
      :delay="500"
      @click="handleOpenUpload"
    />
    <CommonButton
      :tooltip="$t('views.ftpClient.createFolder')"
      :icon="FolderOutline"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      @click="handleCreateFolder"
    />
    <CommonButton
      :tooltip="$t('common.delete')"
      :icon="TrashBinOutline"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      @click="handleDeleteCheckedItem"
    />
    <CommonButton
      :tooltip="$t('common.refresh')"
      :icon="Refresh"
      :loading="fileListLoading"
      :button-props="{ size: 'small', circle: true }"
      placement="bottom"
      :delay="500"
      @click="getFiles"
    />
  </n-space>
</template>

<style lang="less" scoped></style>

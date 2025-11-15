<script setup lang="ts">
import { useUpload } from '@renderer/composables/share-hub/useUpload'
import FileUploadForm from './file-upload-form/FileUploadForm.vue'

const { uploadFormRef, uploadModalVisible, uploadForm, confirmUpload } = useUpload()
</script>

<template>
  <CommonDialog
    v-model:visible="uploadModalVisible"
    :title="$t('views.shareHub.fileUpload')"
    width="450px"
    :on-confirm="confirmUpload"
  >
    <!-- 内容插槽 -->
    <FileUploadForm ref="uploadFormRef" v-model:file-info="uploadForm" />
  </CommonDialog>
</template>

<script setup lang="ts">
import { useUpload } from '@renderer/composables/share-hub/useUpload'
import FileUploadForm from './file-upload-form/FileUploadForm.vue'

const { uploadLoading, uploadFormRef, uploadModalVisible, uploadForm, confirmUpload } = useUpload()
</script>

<template>
  <n-modal
    v-model:show="uploadModalVisible"
    style="width: 450px"
    preset="card"
    size="small"
    :title="$t('views.shareHub.fileUpload')"
    :mask-closable="false"
  >
    <FileUploadForm ref="uploadFormRef" v-model:file-info="uploadForm"></FileUploadForm>

    <template #footer>
      <n-flex justify="end">
        <n-button type="primary" size="small" :loading="uploadLoading" @click="confirmUpload">
          {{ $t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="uploadModalVisible = false">
          {{ $t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

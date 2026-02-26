<script setup lang="ts">
import FtpConnectionForm from './connection-form/FtpConnectionForm.vue'
import S3ConnectionForm from './connection-form/S3ConnectionForm.vue'
import ConnectionTree from './connection-tree/ConnectionTree.vue'
import { useConectionModal } from '@renderer/composables/file-sync/useConnectionModal'

const {
  storageType,
  formRef,
  visible,
  currentStep,
  connectionConfig,
  connectLoading,
  selectedPath,
  prevStep,
  submitForm,
} = useConectionModal()
</script>

<template>
  <CommonDialog
    v-model:visible="visible"
    :title="
      [
        '',
        storageType.toUpperCase() + ' ' + $t('views.fileSync.ConnectionConfig'),
        $t('views.fileSync.selectPath'),
      ][currentStep]
    "
  >
    <template v-if="currentStep === 1">
      <FtpConnectionForm
        v-if="storageType === 'ftp' && !!connectionConfig"
        ref="formRef"
        v-model:ftp-config="connectionConfig"
      ></FtpConnectionForm>
      <S3ConnectionForm
        v-else-if="storageType === 's3' && !!connectionConfig"
        ref="formRef"
        v-model:s3-config="connectionConfig"
      ></S3ConnectionForm>
    </template>

    <ConnectionTree v-else v-model:selected-path="selectedPath"></ConnectionTree>

    <template #footer>
      <el-button v-if="currentStep === 2" @click="prevStep">
        {{ $t('common.prev') }}
      </el-button>
      <el-button type="primary" :loading="connectLoading" @click="submitForm">
        {{ $t('common.confirm') }}
      </el-button>
      <el-button @click="visible = false">
        {{ $t('common.cancel') }}
      </el-button>
    </template>
  </CommonDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const FtpConfig = computed(() => {
  if (storageType.value === 'ftp') {
    return connectionConfig.value as FtpConfig
  } else {
    return null
  }
})

const S3Config = computed(() => {
  if (storageType.value === 's3') {
    return connectionConfig.value as S3Config
  } else {
    return null
  }
})
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
        v-if="storageType === 'ftp' && FtpConfig"
        ref="formRef"
        v-model:ftp-config="FtpConfig"
      ></FtpConnectionForm>
      <S3ConnectionForm
        v-else-if="storageType === 's3' && S3Config"
        ref="formRef"
        v-model:s3-config="S3Config"
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

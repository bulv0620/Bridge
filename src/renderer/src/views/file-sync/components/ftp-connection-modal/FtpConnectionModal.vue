<script setup lang="ts">
import { useFtpConectionModal } from '@renderer/composables/file-sync/useFtpConnectionModal'
import FtpConnectionForm from './ftp-connection-form/FtpConnectionForm.vue'
import FtpConnectionTree from './ftp-connection-tree/FtpConnectionTree.vue'
import { nextTick, watch } from 'vue'

const {
  ftpFormRef,
  visible,
  currentStep,
  ftpConfig,
  connectLoading,
  selectedPath,
  prevStep,
  submitForm,
} = useFtpConectionModal()

watch(visible, (val) => {
  if (val) {
    nextTick(() => {
      ftpFormRef.value.clearValidate()
    })
  }
})
</script>

<template>
  <CommonDialog
    v-model:visible="visible"
    :title="['', $t('views.fileSync.ftpConfig'), $t('views.fileSync.selectPath')][currentStep]"
  >
    <FtpConnectionForm
      v-if="currentStep === 1"
      ref="ftpFormRef"
      v-model:ftp-config="ftpConfig"
    ></FtpConnectionForm>

    <FtpConnectionTree v-else v-model:selected-path="selectedPath"></FtpConnectionTree>

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

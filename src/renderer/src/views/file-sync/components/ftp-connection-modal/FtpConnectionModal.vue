<script setup lang="ts">
import { useFtpConectionModal } from '@renderer/composables/file-sync/useFtpConnectionModal'
import FtpConnectionForm from './ftp-connection-form/FtpConnectionForm.vue'
import FtpConnectionTree from './ftp-connection-tree/FtpConnectionTree.vue'

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
</script>

<template>
  <n-modal
    v-model:show="visible"
    style="width: 500px"
    preset="card"
    size="small"
    :title="$t('views.fileSync.ftpConfig')"
    :mask-closable="false"
  >
    <n-steps size="small" :current="currentStep" style="margin-bottom: 18px">
      <n-step :title="$t('views.fileSync.ftpConfig')" />
      <n-step :title="$t('views.fileSync.selectPath')" />
    </n-steps>
    <FtpConnectionForm
      v-if="currentStep === 1"
      ref="ftpFormRef"
      v-model:ftp-config="ftpConfig"
    ></FtpConnectionForm>

    <FtpConnectionTree v-else v-model:selected-path="selectedPath"></FtpConnectionTree>

    <template #footer>
      <n-flex justify="end">
        <n-button
          v-if="currentStep === 2"
          size="small"
          style="margin-right: auto"
          @click="prevStep"
        >
          {{ $t('common.prev') }}
        </n-button>
        <n-button type="primary" size="small" :loading="connectLoading" @click="submitForm">
          {{ $t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ $t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

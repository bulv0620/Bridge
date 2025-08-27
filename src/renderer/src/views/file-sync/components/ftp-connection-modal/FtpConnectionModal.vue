<script setup lang="ts">
import { useFtpConectionModal } from '@renderer/composables/file-sync-v2/useFtpConnectionModal'
import FtpConnectionForm from '../ftp-connection-form/FtpConnectionForm.vue'

const { ftpFormRef, visible, ftpConfig, submitForm } = useFtpConectionModal()
</script>

<template>
  <n-modal
    v-model:show="visible"
    style="width: 500px"
    preset="card"
    :title="$t('views.fileSync.ftpConfig')"
    :mask-closable="false"
  >
    <FtpConnectionForm ref="ftpFormRef" v-model:ftp-config="ftpConfig"></FtpConnectionForm>

    <template #footer>
      <n-flex justify="end">
        <n-button type="primary" size="small" @click="submitForm">
          {{ $t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ $t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { useFileDownloadModal } from '@renderer/composables/ftp-client/useFileDownloadModal'

const {
  loading,
  visible,
  downloadFiles,
  currentDownloadIndex,
  errorFlag,
  percentage,
  currentDownloadFile,
  complete,
  closeModal,
} = useFileDownloadModal()
</script>

<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 500px; max-width: 100%`"
    preset="card"
    :title="$t('views.ftpClient.download')"
    :on-after-leave="closeModal"
    :mask-closable="false"
    :esc-key-closable="false"
  >
    <n-progress
      :processing="loading"
      :status="errorFlag ? 'error' : complete ? 'success' : 'info'"
      type="line"
      :percentage="percentage"
    >
      <n-text :type="errorFlag ? 'error' : ''">
        {{ currentDownloadIndex }} / {{ downloadFiles.length }}
      </n-text>
    </n-progress>
    <n-text v-if="complete" type="success">{{ $t('common.complete') }}</n-text>
    <n-ellipsis v-else :type="errorFlag ? 'error' : ''" style="width: 100%">
      {{ currentDownloadFile?.fileName }}
    </n-ellipsis>

    <template #footer>
      <n-flex>
        <n-button size="small" @click="visible = false">
          {{ $t('common.close') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

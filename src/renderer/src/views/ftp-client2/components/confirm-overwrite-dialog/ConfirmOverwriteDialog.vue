<script setup lang="ts">
import { useOverwriteConfirm } from '@renderer/composables/ftp-client/useOverwriteConfirm'

const { visible, remember, fileName, onConfirm, onCancel } = useOverwriteConfirm()
</script>

<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 380px; max-width: 100%`"
    title="提示"
    preset="card"
    :mask-closable="false"
    :esc-key-closable="false"
    @close="onCancel"
  >
    <div>{{ $t('views.ftpClient.confirmOverwrite', { fileName }) }}</div>
    <n-space align="center" style="margin-top: 16px"> </n-space>
    <template #footer>
      <n-space justify="space-between">
        <n-checkbox v-model:checked="remember">{{ $t('common.remember') }}</n-checkbox>

        <n-space>
          <n-button type="primary" size="small" @click="onConfirm">
            {{ $t('common.confirm') }}
          </n-button>
          <n-button size="small" @click="onCancel">{{ $t('common.cancel') }}</n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
</template>

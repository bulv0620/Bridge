<script setup lang="ts">
import { NInput } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useCreateDownloadTaskModal } from '@renderer/composables/downloader/useCreateDownloadTaskModal'

const { t } = useI18n()

const { show, urlInput, loading, inputRef, submitDownloadTask } = useCreateDownloadTaskModal()
</script>

<template>
  <n-modal
    v-model:show="show"
    :title="t('views.downloader.createTask')"
    preset="card"
    style="width: 500px"
  >
    <n-input
      ref="inputRef"
      v-model:value="urlInput"
      type="textarea"
      :placeholder="t('views.downloader.urlInputPlaceholder')"
      :rows="5"
    />

    <template #footer>
      <n-space justify="end">
        <n-button @click="show = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" :loading="loading" @click="submitDownloadTask">
          {{ t('common.confirm') }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

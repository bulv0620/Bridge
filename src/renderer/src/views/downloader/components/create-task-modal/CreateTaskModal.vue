<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useCreateDownloadTaskModal } from '@renderer/composables/downloader/useCreateDownloadTaskModal'
import { watch, nextTick, useTemplateRef } from 'vue'
import { ElInput } from 'element-plus'

const { t } = useI18n()

const { show, urlInput, submitDownloadTask } = useCreateDownloadTaskModal()

const inputRef = useTemplateRef<InstanceType<typeof ElInput>>('inputRef')

/** 点击确认 */
const handleConfirm = async () => {
  await submitDownloadTask()
}

/** 关闭前，重置内容 */
const handleBeforeClose = async () => {
  urlInput.value = ''
}

watch(show, (val) => {
  if (val) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})
</script>

<template>
  <common-dialog
    v-model:visible="show"
    :title="t('views.downloader.createTask')"
    width="500px"
    :on-confirm="handleConfirm"
    :before-close="handleBeforeClose"
  >
    <!-- 对话框内容 -->
    <el-input
      ref="inputRef"
      v-model="urlInput"
      type="textarea"
      :rows="5"
      :placeholder="t('views.downloader.urlInputPlaceholder')"
    />
  </common-dialog>
</template>

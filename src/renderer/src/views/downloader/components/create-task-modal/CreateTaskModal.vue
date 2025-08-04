<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { NInput, useMessage } from 'naive-ui'
import { useAria2 } from '@renderer/composables/aria2'
import { useI18n } from 'vue-i18n'

const show = defineModel<boolean>('show', { default: false })

const { aria2 } = useAria2()
const message = useMessage()
const { t } = useI18n()

const urlInput = ref('')
const loading = ref(false)
const inputRef = ref<InstanceType<typeof NInput> | null>(null)

watch(show, (newVal) => {
  if (newVal) {
    urlInput.value = ''
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

const handleSubmit = async () => {
  const urls = urlInput.value
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => !!u)
  if (!urls.length) {
    message.warning(t('views.downloader.enterValidUrl'))
    return
  }

  try {
    loading.value = true
    await aria2.value?.addUri(urls)
    message.success(t('views.downloader.taskAdded'))
    show.value = false
    urlInput.value = ''
  } catch (err) {
    message.error(t('views.downloader.taskAddFailed'))
  } finally {
    loading.value = false
  }
}
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
        <n-button type="primary" :loading="loading" @click="handleSubmit">
          {{ t('common.confirm') }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

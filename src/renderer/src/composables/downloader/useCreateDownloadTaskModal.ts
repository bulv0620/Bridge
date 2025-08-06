import { ref, nextTick } from 'vue'
import { useAria2 } from './useAria2'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'

const { aria2 } = useAria2()

const show = ref(false)
const urlInput = ref('')
const loading = ref(false)
const inputRef = ref<InstanceType<any> | null>(null)

export function useCreateDownloadTaskModal() {
  const { t } = useI18n()
  const message = useMessage()

  function openCreateTaskModal(url?: string) {
    show.value = true
    urlInput.value = url ?? ''
    nextTick(() => {
      inputRef.value?.focus()
    })
  }

  async function submitDownloadTask() {
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
      await aria2.value!.addUri(urls)
      message.success(t('views.downloader.taskAdded'))
      show.value = false
      urlInput.value = ''
    } catch (err) {
      message.error(t('views.downloader.taskAddFailed'))
    } finally {
      loading.value = false
    }
  }

  return {
    show,
    urlInput,
    loading,
    inputRef,
    openCreateTaskModal,
    submitDownloadTask,
  }
}

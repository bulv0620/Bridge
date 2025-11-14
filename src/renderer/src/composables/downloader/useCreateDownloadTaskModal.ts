import { ref } from 'vue'
import { useAria2 } from './useAria2'
import { i18n } from '@renderer/locales'
import { ElMessage } from 'element-plus'

const { aria2 } = useAria2()

const { t } = i18n.global

const show = ref(false)
const urlInput = ref('')
const loading = ref(false)

function openCreateTaskModal(url?: string) {
  show.value = true
  urlInput.value = url ?? ''
}

async function submitDownloadTask() {
  const urls = urlInput.value
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => !!u)

  if (!urls.length) {
    ElMessage.warning(t('views.downloader.enterValidUrl'))
    return
  }

  try {
    loading.value = true
    await aria2.value!.addUri(urls)
    ElMessage.success(t('views.downloader.taskAdded'))
    show.value = false
    urlInput.value = ''
  } catch (err) {
    ElMessage.error(t('views.downloader.taskAddFailed'))
  } finally {
    loading.value = false
  }
}

export function useCreateDownloadTaskModal() {
  return {
    show,
    urlInput,
    loading,
    openCreateTaskModal,
    submitDownloadTask,
  }
}

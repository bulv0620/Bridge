import { ref, nextTick } from 'vue'
import { useAria2 } from './useAria2'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { useTaskList } from './useTaskList'

const { aria2, isConnected } = useAria2()

const { t } = i18n.global
const { message } = useDiscreteApi()

const { activeTaskListTab } = useTaskList()

const show = ref(false)
const urlInput = ref('')
const loading = ref(false)
const inputRef = ref<InstanceType<any> | null>(null)

function openCreateTaskModal(url?: string) {
  if (!aria2.value || !isConnected.value) {
    return
  }
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
    activeTaskListTab.value = 'downloading'
  } catch (err) {
    message.error(t('views.downloader.taskAddFailed'))
  } finally {
    loading.value = false
  }
}

export function useCreateDownloadTaskModal() {
  return {
    show,
    urlInput,
    loading,
    inputRef,
    openCreateTaskModal,
    submitDownloadTask,
  }
}

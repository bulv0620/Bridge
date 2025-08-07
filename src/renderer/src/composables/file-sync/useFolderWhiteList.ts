import { i18n } from '@renderer/locales'
import { ref, watch } from 'vue'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'

const { t } = i18n.global
const { message } = useDiscreteApi()

const visible = ref(false)

const folderWhiteList = ref<string[]>([])
const editingWhiteList = ref<string[]>([])

const showAlert = ref<boolean>(true)

function closeAlert() {
  localStorage.setItem('hideWhiteListInfo', '1')
}

function openWhiteListModal() {
  editingWhiteList.value = folderWhiteList.value.map((el) => el)
  visible.value = true
}

function confirmWhiteList() {
  if (editingWhiteList.value.some((item) => item.trim() === '')) {
    message.error(t('views.fileSync.folderWhiteListEmptyValue'))
    return
  }

  folderWhiteList.value = editingWhiteList.value

  visible.value = false
}

function closeModal() {
  visible.value = false
}

watch(visible, (val) => {
  if (val && localStorage.getItem('hideWhiteListInfo')) {
    showAlert.value = false
  }
})

export function useFolderWhiteList() {
  return {
    visible,
    folderWhiteList,
    editingWhiteList,
    showAlert,
    closeAlert,
    openWhiteListModal,
    confirmWhiteList,
    closeModal,
  }
}

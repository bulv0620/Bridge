import { useMessage } from 'naive-ui'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const visible = ref(false)

const whiteList = ref<string[]>([])
const editingWhiteList = ref<string[]>([])

const showAlert = ref<boolean>(true)

watch(visible, (val) => {
  if (val && localStorage.getItem('hideWhiteListInfo')) {
    showAlert.value = false
  }
})

export function useFolderWhiteList() {
  const { t } = useI18n()
  const message = useMessage()

  function closeAlert() {
    localStorage.setItem('hideWhiteListInfo', '1')
  }

  function openWhiteListModal() {
    editingWhiteList.value = whiteList.value.map((el) => el)
    visible.value = true
  }

  function confirmWhiteList() {
    if (editingWhiteList.value.some((item) => item.trim() === '')) {
      message.error(t('views.fileSync.folderWhiteListEmptyValue'))
      return
    }

    whiteList.value = editingWhiteList.value

    visible.value = false
  }

  function closeModal() {
    visible.value = false
  }

  return {
    visible,
    whiteList,
    editingWhiteList,
    showAlert,
    closeAlert,
    openWhiteListModal,
    confirmWhiteList,
    closeModal,
  }
}

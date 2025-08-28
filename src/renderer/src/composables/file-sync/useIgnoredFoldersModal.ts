import { ref } from 'vue'
import { useSyncForm } from './useSyncForm'

const { syncForm } = useSyncForm()

const visible = ref(false)
const edtingIgnoredFolderList = ref<string[]>([])

function openIgnoredFoldersModal() {
  edtingIgnoredFolderList.value = [...syncForm.ignoredFolders]
  visible.value = true
}

function conifrmIgnoredFolders() {
  syncForm.ignoredFolders = edtingIgnoredFolderList.value.filter((folder) => !!folder)
  closeModal()
}

function closeModal() {
  visible.value = false
}

export function useIgnoredFoldersModal() {
  return {
    visible,
    edtingIgnoredFolderList,
    openIgnoredFoldersModal,
    conifrmIgnoredFolders,
    closeModal,
  }
}

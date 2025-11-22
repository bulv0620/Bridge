import { ref, toRaw } from 'vue'
import { useActiveSyncSession } from './useActiveSyncSession'

const { activeSessionState, activeSessionId } = useActiveSyncSession()

const visible = ref(false)
const edtingIgnoredFolderList = ref<string[]>([])

function openIgnoredFoldersModal() {
  edtingIgnoredFolderList.value = [...activeSessionState.value.formData.ignoredFolders]
  visible.value = true
}

function conifrmIgnoredFolders() {
  activeSessionState.value.formData.ignoredFolders = edtingIgnoredFolderList.value.filter(
    (folder) => !!folder,
  )
  window.ipc.sync.setIgnoredFolders(
    activeSessionId.value,
    toRaw(activeSessionState.value.formData.ignoredFolders),
  )
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

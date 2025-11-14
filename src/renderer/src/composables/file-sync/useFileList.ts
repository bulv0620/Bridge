import { ref } from 'vue'

// const tableLoading = ref(false)
const diffFileList = ref<FileDifference[]>([])

async function getRootList() {
  diffFileList.value = []
  const result = await window.ipc.sync.getDiffItems(null)
  diffFileList.value = result
}

async function getFileList(parentRow: FileDifference): Promise<FileDifference[]> {
  const list = await window.ipc.sync.getDiffItems(parentRow.id)
  return list
}

export function useFileList() {
  return {
    diffFileList,
    getRootList,
    getFileList,
  }
}

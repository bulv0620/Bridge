import { ref } from 'vue'

const crypto = window.api.crypto
const fs = window.api.fsSync

export interface SharedFileInfo {
  uuid: string
  type: string
  fileName: string
  fileSize: number
  date: number
  exp: number
  consumableCount: number
}

const sharedFiles = ref<SharedFileInfo[]>([])

function addShare(files: File[]) {
  for (const f of files) {
    let type = ''
    const stats = fs.statSync(f.path)
    console.log(stats)

    if (stats.isDirectory()) {
      type = 'folder'
    } else {
      type = f.name.split('.').pop()?.toLowerCase() || ''
    }

    sharedFiles.value.push({
      uuid: crypto.randomUUID(),
      type,
      fileName: f.name,
      fileSize: type === 'folder' ? 0 : f.size,
      date: Date.now(),
      exp: Date.now() + 2 * 60 * 1000,
      consumableCount: 1,
    })
  }
}

export function useSharedFileList() {
  return {
    sharedFiles,
    addShare,
  }
}

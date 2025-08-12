import { useNow } from '@vueuse/core'
import { computed, ref } from 'vue'

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

const now = useNow({ interval: 1000 })

const sharedFileList = ref<SharedFileInfo[]>([])

const validSharedFileList = computed(() => {
  return sharedFileList.value.filter((f) => f.exp > now.value.getTime())
})

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

    sharedFileList.value.push({
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
    sharedFileList,
    validSharedFileList,
    addShare,
  }
}

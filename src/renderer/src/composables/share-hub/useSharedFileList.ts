import { useNow } from '@vueuse/core'
import { computed, ref } from 'vue'

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
  console.log(files)
}

export function useSharedFileList() {
  return {
    sharedFileList,
    validSharedFileList,
    addShare,
  }
}

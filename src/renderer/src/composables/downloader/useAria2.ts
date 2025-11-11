import { Aria2Client } from '@renderer/utils/aria2/Aria2Client'
import { ref } from 'vue'

const aria2 = ref<IAria2Client>(
  new Aria2Client({ url: 'http://localhost:6800/jsonrpc', token: 'bulv' }),
)

export function useAria2() {
  return {
    aria2,
  }
}

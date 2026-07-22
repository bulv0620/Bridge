import { ref } from 'vue'

const clipboardActive = ref(true)

export function useCollapse() {
  return {
    clipboardActive,
  }
}

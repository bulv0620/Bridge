import { ref } from 'vue'

const clipboardActive = ref(false)

export function useCollapse() {
  return {
    clipboardActive,
  }
}

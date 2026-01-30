import { ref } from 'vue'

const file = ref<File | null>(null)

export function useFile() {
  return {
    file,
  }
}

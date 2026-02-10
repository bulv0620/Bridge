import { ref, watch } from 'vue'

const clipboardActive = ref(false)
const tasksActive = ref(true)

watch(clipboardActive, (val) => {
  if (val && tasksActive.value) {
    tasksActive.value = false
  }
})

watch(tasksActive, (val) => {
  if (val && clipboardActive.value) {
    clipboardActive.value = false
  }
})

export function useCollapse() {
  return {
    clipboardActive,
    tasksActive,
  }
}

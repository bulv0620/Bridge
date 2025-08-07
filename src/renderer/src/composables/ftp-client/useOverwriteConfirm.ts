import { ref } from 'vue'

const visible = ref(false)
const remember = ref(false)
const fileName = ref('')
let resolver: ((value: [boolean, boolean]) => void) | null = null

function overwriteConfirm(name: string): Promise<[boolean, boolean]> {
  visible.value = true
  remember.value = false
  fileName.value = name
  return new Promise((resolve) => {
    resolver = resolve
  })
}

function close() {
  visible.value = false
  resolver = null
}

function onConfirm() {
  if (resolver) {
    resolver([true, remember.value])
  }
  close()
}

function onCancel() {
  if (resolver) {
    resolver([false, remember.value])
  }
  close()
}

export function useOverwriteConfirm() {
  return {
    visible,
    remember,
    fileName,
    overwriteConfirm,
    onConfirm,
    onCancel,
  }
}

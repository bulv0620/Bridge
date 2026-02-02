import { ref } from 'vue'
import { computed } from 'vue'
import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'

const visible = ref(false)

const lanDiscoverable = useRemoteRef('lan-discoverable', false)
const capabilities = useRemoteRef<string[]>('share-capabilities', [])

const filePushEnabled = createCapProxy('file-push')
const clipboardEnabled = createCapProxy('clipboard')

const configForm = ref({
  lanDiscoverable: false,
  filePushEnabled: false,
  clipboardEnabled: false,
})

function createCapProxy(tag: string) {
  return computed({
    get: () => capabilities.value.includes(tag),
    set: (val: boolean) => {
      if (val) {
        if (!capabilities.value.includes(tag)) {
          capabilities.value = [...capabilities.value, tag]
        }
      } else {
        capabilities.value = capabilities.value.filter((i) => i !== tag)
      }
    },
  })
}

function openSettingModal() {
  configForm.value.lanDiscoverable = lanDiscoverable.value
  configForm.value.filePushEnabled = filePushEnabled.value
  configForm.value.clipboardEnabled = clipboardEnabled.value

  visible.value = true
}

function confirm() {
  lanDiscoverable.value = configForm.value.lanDiscoverable
  filePushEnabled.value = configForm.value.filePushEnabled
  clipboardEnabled.value = configForm.value.clipboardEnabled

  visible.value = false
}

export function useSettingModal() {
  return {
    visible,
    configForm,
    openSettingModal,
    confirm,
  }
}

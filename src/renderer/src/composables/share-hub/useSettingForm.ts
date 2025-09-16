import { ref } from 'vue'

const enableSharing = ref(false)
const enableSharingLoading = ref(false)
const showMyFiles = ref(false)

async function handleUpdateEnableSharing(val) {
  enableSharingLoading.value = true
  try {
    if (val) {
      await window.ipc.share.start()
      enableSharing.value = true
    } else {
      await window.ipc.share.stop()
      enableSharing.value = false
    }
  } catch (error) {
    console.error(error)
  } finally {
    enableSharingLoading.value = false
  }
}

export function useSettingForm() {
  return {
    enableSharing,
    enableSharingLoading,
    showMyFiles,
    handleUpdateEnableSharing,
  }
}

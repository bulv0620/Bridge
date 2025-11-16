import { ref, watch } from 'vue'
import { useRemoteRef } from '../remote-ref/useRemoteRef'

const enableSharing = ref(false)
const enableSharingLoading = ref(false)
const mySharedFiles = useRemoteRef<SharedFileInfo[]>('shared-file-list', [])
const onlineDevices = useRemoteRef<OnlineDevice[]>('online-device', [])

async function handleUpdateEnableSharing(val: boolean) {
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

watch(enableSharing, (val) => {
  if (!val) {
    onlineDevices.value = []
  }
})

export function useSharing() {
  return {
    mySharedFiles,
    onlineDevices,
    enableSharing,
    enableSharingLoading,
    handleUpdateEnableSharing,
  }
}

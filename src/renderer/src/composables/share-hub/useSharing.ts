import { ref, watch } from 'vue'

const enableSharing = ref(false)
const enableSharingLoading = ref(false)
const mySharedFiles = ref<SharedFileInfo[]>([])
const onlineDevices = ref<OnlineDevice[]>([])

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

window.events.on('share:message', (message: { onlineDevices: OnlineDevice[] }) => {
  const incoming = message.onlineDevices

  const incomingMap = new Map<string, OnlineDevice>()
  for (const dev of incoming) {
    incomingMap.set(dev.id, dev)
  }

  const toRemove: number[] = []

  for (let i = 0; i < onlineDevices.value.length; i++) {
    const existing = onlineDevices.value[i]
    const updated = incomingMap.get(existing.id)
    if (updated) {
      existing.lastSeen = updated.lastSeen
      existing.data = updated.data
      existing.mine = updated.mine
      existing.ip = updated.ip
      existing.platform = updated.platform

      incomingMap.delete(existing.id)
    } else {
      toRemove.push(i)
    }
  }

  for (let i = toRemove.length - 1; i >= 0; i--) {
    onlineDevices.value.splice(toRemove[i], 1)
  }

  for (const dev of incomingMap.values()) {
    onlineDevices.value.push(dev)
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

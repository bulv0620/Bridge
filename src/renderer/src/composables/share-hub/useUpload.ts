import FileUploadForm from '@renderer/views/share-hub/components/file-upload-modal/file-upload-form/FileUploadForm.vue'
import { ref, toRaw } from 'vue'
import { useSharing } from './useSharing'

const { onlineDevices } = useSharing()

const uploadFormRef = ref<InstanceType<typeof FileUploadForm> | null>(null)
const uploadModalVisible = ref(false)
const uploadForm = ref<SharedFileInfo>({
  id: '',
  filePath: '',
  fileName: '',
  type: '',
  size: 0,
  status: {
    remaining: 0,
    total: 0,
    createdAt: 0,
    expiresAt: 0,
  },
})
const uploadLoading = ref(false)

function openUploadModal(initData: SharedFileInfo) {
  uploadModalVisible.value = true
  uploadForm.value = initData
}

async function confirmUpload() {
  uploadLoading.value = true
  try {
    await uploadFormRef.value?.validate()
    await window.ipc.share.addFile(toRaw(uploadForm.value))

    const me = onlineDevices.value.find((device) => device.me)

    if (me) {
      me.data.files.push(toRaw(uploadForm.value))
    }

    uploadModalVisible.value = false
  } catch (error) {
    console.error(error)
  } finally {
    uploadLoading.value = false
  }
}

export function useUpload() {
  return {
    uploadLoading,
    uploadFormRef,
    uploadModalVisible,
    uploadForm,
    openUploadModal,
    confirmUpload,
  }
}

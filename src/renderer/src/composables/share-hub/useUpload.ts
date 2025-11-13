import FileUploadForm from '@renderer/views/share-hub/components/file-upload-modal/file-upload-form/FileUploadForm.vue'
import { ref } from 'vue'
import { useSharing } from './useSharing'
import { getExpireTime } from '@renderer/utils/expires-time'

const { mySharedFiles } = useSharing()

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
    mySharedFiles.value.push({
      ...uploadForm.value,
      status: {
        ...uploadForm.value.status,
        remaining: uploadForm.value.status.total,
        expiresAt: getExpireTime(uploadForm.value.status.expireType!),
      },
    })

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

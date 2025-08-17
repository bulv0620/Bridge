import { ref } from 'vue'
import FtpConnectionForm from '@renderer/views/file-sync-v2/components/ftp-connection-form/FtpConnectionForm.vue'

const ftpFormRef = ref<InstanceType<typeof FtpConnectionForm> | null>(null)
const visible = ref(false)
const ftpConfig = ref<FtpConfig>({
  host: '',
  port: 21,
  user: '',
  password: '',
  secure: false,
  secureOptions: {
    rejectUnauthorized: false,
  },
})

async function submitForm() {
  await ftpFormRef.value?.validate()
}

function openFtpConnectionModal() {
  ftpConfig.value = {
    host: '',
    port: 21,
    user: '',
    password: '',
    secure: false,
    secureOptions: {
      rejectUnauthorized: false,
    },
  }
  visible.value = true
}

export function useFtpConectionModal() {
  return {
    ftpFormRef,
    visible,
    ftpConfig,
    submitForm,
    openFtpConnectionModal,
  }
}

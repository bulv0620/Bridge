import { ref } from 'vue'
import FtpConnectionForm from '@renderer/views/file-sync/components/ftp-connection-form/FtpConnectionForm.vue'

const ftpFormRef = ref<InstanceType<typeof FtpConnectionForm> | null>(null)
const visible = ref(false)
const currentStep = ref(1)
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

async function prevStep() {
  currentStep.value--
}

async function submitForm() {
  if (currentStep.value === 1) {
    // 配置ftp确认
    await ftpFormRef.value?.validate()

    currentStep.value++
  } else {
    // 路径选择确认
  }
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
  currentStep.value = 1
  visible.value = true
}

export function useFtpConectionModal() {
  return {
    ftpFormRef,
    visible,
    currentStep,
    ftpConfig,
    prevStep,
    submitForm,
    openFtpConnectionModal,
  }
}

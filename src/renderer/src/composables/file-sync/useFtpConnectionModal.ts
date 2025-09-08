import { ref, toRaw, watch } from 'vue'
import FtpConnectionForm from '@renderer/views/file-sync/components/ftp-connection-form/FtpConnectionForm.vue'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { i18n } from '@renderer/locales'

type PromiseState<T> = {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
} | null

const { message } = useDiscreteApi()
const { t } = i18n.global

const promiseState = ref<PromiseState<StorageEngineConfig>>(null)

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
const connectLoading = ref(false)
const selectedPath = ref<string[]>([])

watch(visible, (val) => {
  if (!val && promiseState.value && promiseState.value.reject) {
    promiseState.value.reject()
    promiseState.value = null
  }
})

async function prevStep() {
  currentStep.value--
}

async function submitForm() {
  if (currentStep.value === 1) {
    connectLoading.value = true
    // 配置ftp确认
    await ftpFormRef.value?.validate()
    try {
      // 创建连接实例
      await window.ipc.sync.createInstance({
        storageType: 'ftp',
        path: '/',
        connectionConfig: toRaw(ftpConfig.value),
      })
      selectedPath.value = []
      currentStep.value++
    } catch (error) {
      message.error(t('views.fileSync.connectionFailed'))
    } finally {
      connectLoading.value = false
    }
  } else {
    promiseState.value?.resolve({
      storageType: 'ftp',
      path: toRaw(selectedPath.value[0]),
      connectionConfig: toRaw(ftpConfig.value),
    })
    promiseState.value = null
    visible.value = false
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

  return new Promise<StorageEngineConfig>((resolve, reject) => {
    promiseState.value = {
      resolve,
      reject,
    }
  })
}

export function useFtpConectionModal() {
  return {
    ftpFormRef,
    visible,
    currentStep,
    ftpConfig,
    connectLoading,
    selectedPath,
    prevStep,
    submitForm,
    openFtpConnectionModal,
  }
}

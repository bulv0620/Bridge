import { nextTick, ref, toRaw, watch } from 'vue'
import { i18n } from '@renderer/locales'
import { ElMessage } from 'element-plus'

type PromiseState<T> = {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
} | null

const { t } = i18n.global

const promiseState = ref<PromiseState<StorageEngineConfig>>(null)

// 初始化数据
const connectionConfigInitData = new Map<StorageType, ConnectionConfig>([
  [
    'ftp',
    {
      host: '',
      port: 21,
      user: '',
      password: '',
      secure: false,
      secureOptions: {
        rejectUnauthorized: false,
      },
    },
  ],
  [
    's3',
    {
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
      bucket: '',
      endpoint: '',
      forcePathStyle: true,
    },
  ],
])

const visible = ref(false)
const connectLoading = ref(false)
const formRef = ref<any>(null)
const currentStep = ref(1) // 当前步骤
const storageType = ref<StorageType>('ftp') // 配置类型
const connectionConfig = ref<ConnectionConfig>() // 配置form内容
const selectedPath = ref<string>('') // 选择的路径

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
    await formRef.value?.validate()
    // 配置ftp确认
    try {
      connectLoading.value = true
      // 创建连接实例
      await window.ipc.sync.createInstance({
        storageType: storageType.value,
        path: '/',
        connectionConfig: toRaw(connectionConfig.value),
      })
      selectedPath.value = ''
      currentStep.value++
    } catch (error) {
      ElMessage.error(t('views.fileSync.connectionFailed'))
    } finally {
      connectLoading.value = false
    }
  } else {
    promiseState.value?.resolve({
      storageType: storageType.value,
      path: selectedPath.value || '/',
      connectionConfig: toRaw(connectionConfig.value),
    })
    promiseState.value = null
    visible.value = false
  }
}

function openConnectionModal(type: StorageType) {
  storageType.value = type

  connectionConfig.value = JSON.parse(JSON.stringify(connectionConfigInitData.get(type)))

  currentStep.value = 1
  visible.value = true

  nextTick(() => {
    formRef.value?.clearValidate()
  })

  return new Promise<StorageEngineConfig>((resolve, reject) => {
    promiseState.value = {
      resolve,
      reject,
    }
  })
}

export function useConectionModal() {
  return {
    storageType,
    formRef,
    visible,
    currentStep,
    connectionConfig,
    connectLoading,
    selectedPath,
    prevStep,
    submitForm,
    openConnectionModal,
  }
}

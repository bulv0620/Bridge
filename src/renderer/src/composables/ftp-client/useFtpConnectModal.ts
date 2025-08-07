import { NForm } from 'naive-ui'
import { ref, watch } from 'vue'
import { FtpFileSystem } from '@renderer/utils/file-system'
import { useFtpClient } from './useFtpClient'
import { i18n } from '@renderer/locales'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'

export interface FtpConfig {
  host: string
  port: number
  user: string
  password: string
}

const { t } = i18n.global
const { message } = useDiscreteApi()
const { instanceNameList, addFtpInstance } = useFtpClient()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<InstanceType<typeof NForm> | null>(null)
const connectConfigForm = ref<FtpConfig>({
  host: '',
  port: 21,
  user: '',
  password: '',
})
let ftpInstance: FtpFileSystem | null = null

watch(visible, (val) => {
  if (!val && ftpInstance) {
    ftpInstance.disconnect()
  }
})

function openFtpConnectModal() {
  ftpInstance = null
  connectConfigForm.value = {
    host: '',
    port: 21,
    user: '',
    password: '',
  }
  visible.value = true
}

async function connect() {
  await formRef.value?.validate()
  try {
    loading.value = true

    if (ftpInstance) {
      ftpInstance.disconnect()
    }
    ftpInstance = null

    if (
      instanceNameList.value.includes(
        `${connectConfigForm.value.host}:${connectConfigForm.value.port}(${connectConfigForm.value.user})`,
      )
    ) {
      message.error(t('views.ftpClient.ftpInstanceExists'))
      return
    }

    ftpInstance = new FtpFileSystem(connectConfigForm.value, '/')
    const bool = await ftpInstance.validate()
    if (!bool) {
      message.error(t('views.ftpClient.ftpConnFailed'))
      return
    }

    ftpInstance.disconnect()

    addFtpInstance(ftpInstance)
    visible.value = false
  } catch (error) {
    // 连接失败
    console.error(error)
    message.error(t('views.ftpClient.ftpConnFailed'))
  } finally {
    loading.value = false
  }
}

function closeModal() {
  visible.value = false
}

export function useFtpConnectModal() {
  return {
    visible,
    loading,
    formRef,
    connectConfigForm,
    openFtpConnectModal,
    connect,
    closeModal,
  }
}

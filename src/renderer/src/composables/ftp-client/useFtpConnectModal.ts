import { FormRules, NForm, useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FtpFileSystem } from '@renderer/utils/file-system'
import { useFtpClient } from './useFtpClient'

export interface FtpConfig {
  host: string
  port: number
  user: string
  password: string
}

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

export function useFtpConnectModal() {
  const { t } = useI18n()
  const message = useMessage()

  const rules = computed<FormRules>(() => ({
    host: [
      {
        trigger: ['change'],
        validator(_, value) {
          if (!value) {
            return new Error(t('views.ftpClient.ftpHostRequired'))
          }
          const reg =
            /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
          if (!reg.test(value)) {
            return new Error(t('views.ftpClient.ftpHostFormat'))
          }
          return true
        },
      },
    ],
    port: [
      {
        type: 'number',
        min: 1,
        max: 65535,
        trigger: ['change'],
        message: t('views.ftpClient.ftpPortRange'),
      },
    ],
    user: [
      {
        required: true,
        trigger: ['change'],
        message: t('views.ftpClient.ftpUserRequired'),
      },
    ],
    password: [
      {
        required: true,
        trigger: ['change'],
        message: t('views.ftpClient.ftpPasswordRequired'),
      },
    ],
  }))

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

  return {
    visible,
    loading,
    formRef,
    connectConfigForm,
    rules,
    openFtpConnectModal,
    connect,
    closeModal,
  }
}

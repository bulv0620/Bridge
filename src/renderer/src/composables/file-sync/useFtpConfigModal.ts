import { FormRules, NForm, TreeOption, useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FtpFileSystem } from '@renderer/utils/file-system'
import { FolderInfo, FtpConfig } from '@renderer/composables/file-sync/useSyncTool'

let ftpInstance: FtpFileSystem | null = null

const loading = ref(false)
const visible = ref(false)

watch(visible, (val) => {
  if (!val && ftpInstance) {
    ftpInstance.disconnect()
  }
})

const formRef = ref<InstanceType<typeof NForm> | null>(null)
const resolveRef = ref<((value: any) => void) | null>(null)
const current = ref(1)
const currentStatus = ref('process')
const model = ref<FtpConfig>({
  host: '',
  port: 21,
  user: '',
  password: '',
})

const folderTree = ref<TreeOption[]>([
  {
    label: '/(root)',
    key: '/',
    isLeaf: false,
    children: [],
  },
])
const currentPath = ref<string[]>([])

export function useFtpConfigModal() {
  const { t } = useI18n()
  const message = useMessage()

  const rules = computed<FormRules>(() => ({
    host: [
      {
        trigger: ['change'],
        validator(_, value) {
          if (!value) {
            return new Error(t('views.fileSync.ftpHostRequired'))
          }
          const reg =
            /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
          if (!reg.test(value)) {
            return new Error(t('views.fileSync.ftpHostFormat'))
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
        message: t('views.fileSync.ftpPortRange'),
      },
    ],
    user: [
      {
        required: true,
        trigger: ['change'],
        message: t('views.fileSync.ftpUserRequired'),
      },
    ],
    password: [
      {
        required: true,
        trigger: ['change'],
        message: t('views.fileSync.ftpPasswordRequired'),
      },
    ],
  }))

  async function handleLoad(node: TreeOption) {
    const folderList = await ftpInstance?.getFolder(node.key as string)
    node.children = folderList?.map((label) => ({
      label: label,
      key: `${node.key}/${label}`,
      isLeaf: false,
    }))

    ftpInstance?.disconnect()
  }

  function openFtpConfigModal(initVal: FolderInfo) {
    return new Promise<any>((resolve) => {
      ftpInstance = null
      current.value = 1
      model.value = {
        host: '',
        port: 21,
        user: '',
        password: '',
      }
      visible.value = true
      resolveRef.value = resolve

      if (initVal.type && initVal.type === 'ftp' && initVal.ftpConfig) {
        model.value.host = initVal.ftpConfig.host
        model.value.port = initVal.ftpConfig.port
        model.value.user = initVal.ftpConfig.user
        model.value.password = initVal.ftpConfig.password

        handleNext()
      }
    })
  }

  async function handleNext() {
    await formRef.value?.validate()
    try {
      loading.value = true

      if (ftpInstance) {
        ftpInstance.disconnect()
      }
      ftpInstance = null

      ftpInstance = new FtpFileSystem(model.value)
      const bool = await ftpInstance.validate()
      if (!bool) {
        message.error(t('views.fileSync.ftpConnFailed'))
        return
      }

      current.value = 2

      const folderList = await ftpInstance.getFolder()

      folderTree.value[0].children = folderList.map((label) => ({
        key: `/${label}`,
        label,
        isLeaf: false,
      }))
      currentPath.value = []

      ftpInstance.disconnect()
    } catch (error) {
      // 连接失败
      console.error(error)
      message.error(t('views.fileSync.ftpConnFailed'))
    } finally {
      loading.value = false
    }
  }

  async function handlePrev() {
    current.value = 1
  }

  function confirmConfig() {
    if (resolveRef.value) {
      resolveRef.value({
        ftpConfig: model.value,
        path: currentPath.value[0] || '/',
        type: 'ftp',
      })
      resolveRef.value = null
    }
    visible.value = false
  }

  function closeModal() {
    if (resolveRef.value) {
      resolveRef.value(null)
      resolveRef.value = null
    }
    visible.value = false
  }

  return {
    loading,
    visible,
    formRef,
    resolveRef,
    current,
    currentStatus,
    model,
    folderTree,
    currentPath,
    rules,
    handleLoad,
    openFtpConfigModal,
    handleNext,
    handlePrev,
    confirmConfig,
    closeModal,
  }
}

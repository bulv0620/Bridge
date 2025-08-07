import { nextTick, ref } from 'vue'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { i18n } from '@renderer/locales'

const fs = window.api.fs
const path = window.api.path

const { confirm, message } = useDiscreteApi()
const { t } = i18n.global

const loading = ref(false)
const visible = ref(false)

const language = ref('json')
const configFilePath = ref('')
const configJson = ref('')

function openPluginConfigModal(filePath: string) {
  configFilePath.value = filePath
  language.value = path.extname(filePath).slice(1)

  readJsonFile(filePath)
}

async function readJsonFile(path: string) {
  try {
    loading.value = true
    configJson.value = ''
    const content = await fs.readFile(path, 'utf-8')
    visible.value = true

    await nextTick()

    configJson.value = content
  } catch (error) {
    message.error(t('views.pluginCenter.readConfigError'))
    visible.value = false
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  if (loading.value) return

  await confirm('info', {
    title: t('common.info'),
    content: t('views.pluginCenter.configFileSaveConfirm'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
  })

  try {
    loading.value = true

    await fs.writeFile(configFilePath.value, configJson.value, 'utf-8')
    message.success(t('views.pluginCenter.configFileSaved'))
    visible.value = false
  } catch (error) {
    message.error(t('views.pluginCenter.configFileSaveError'))
  } finally {
    loading.value = false
  }
}

function closeModal() {
  visible.value = false
}

export function usePluginConfigModal() {
  return {
    loading,
    visible,
    language,
    configFilePath,
    configJson,
    openPluginConfigModal,
    saveConfig,
    closeModal,
  }
}

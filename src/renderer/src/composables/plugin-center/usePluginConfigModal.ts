import { ref } from 'vue'
import { useDiscreteApi } from '../discrete-api/useDiscreteApi'
import { i18n } from '@renderer/locales'

const { confirm, message } = useDiscreteApi()
const { t } = i18n.global

const loading = ref(false)
const visible = ref(false)

const name = ref('')
const language = ref('json')
const configJson = ref('')

async function openPluginConfigModal(pluginName: string) {
  if (loading.value) return
  try {
    loading.value = true
    configJson.value = ''
    const { language: lang, content } = await window.ipc.plugin.getPluginConfig(pluginName)

    visible.value = true

    name.value = pluginName
    language.value = lang
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

    // 保存
    await window.ipc.plugin.savePluginConfig(name.value, configJson.value)

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
    configJson,
    openPluginConfigModal,
    saveConfig,
    closeModal,
  }
}

<script setup lang="ts">
import { dialogPromise } from '@renderer/utils/dialog'
import { useDialog, useMessage } from 'naive-ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeEditor from '@renderer/components/CodeEditor.vue'

const fs = window.api.fs
const path = window.api.path

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const visible = ref(false)

const language = ref('json')
const configFilePath = ref('')
const configJson = ref('')

const open = (filePath: string) => {
  configFilePath.value = filePath
  language.value = path.extname(filePath).slice(1)
  readJsonFile(filePath)
}

const readJsonFile = async (path: string) => {
  try {
    loading.value = true
    configJson.value = ''
    const content = await fs.readFile(path, 'utf-8')
    configJson.value = content

    visible.value = true
  } catch (error) {
    message.error(t('views.pluginCenter.readConfigError'))
    visible.value = false
  } finally {
    loading.value = false
  }
}

const confirm = async () => {
  if (loading.value) return

  await dialogPromise(dialog.info, {
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

const handleNegative = () => {
  visible.value = false
}

defineExpose({
  open,
})
</script>

<template>
  <n-modal
    v-model:show="visible"
    style="width: 620px"
    preset="card"
    :title="$t('views.pluginCenter.config')"
    :on-after-leave="handleNegative"
    :mask-closable="false"
  >
    <CodeEditor v-model:value="configJson" :language="language" height="320px"></CodeEditor>
    <template #footer>
      <n-flex>
        <n-button size="small" type="primary" :loading="loading" @click="confirm">
          {{ t('common.confirm') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

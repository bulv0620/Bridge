<script setup lang="ts">
import { dialogPromise } from '@renderer/utils/dialog'
import { useDialog, useMessage } from 'naive-ui'
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const fs = window.api.fs

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const visible = ref(false)

const logFilePath = ref('')
const log = ref('')
const logRef = ref<any>(null)

const open = (path: string) => {
  visible.value = true

  logFilePath.value = path.trim()

  getLogs()
}

const getLogs = async () => {
  loading.value = true
  try {
    log.value = ''
    log.value = await fs.readFile(logFilePath.value, 'utf-8')

    await nextTick()

    if (logRef.value) {
      logRef.value.scrollTo({ position: 'bottom' })
    }
  } catch (error) {
    message.error(t('views.pluginCenter.logFileReadError'))
  } finally {
    loading.value = false
  }
}

const handleClearLog = async () => {
  loading.value = true
  try {
    await dialogPromise(dialog.warning, {
      title: t('common.warning'),
      content: t('views.pluginCenter.logFileClearConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    })
    await fs.writeFile(logFilePath.value, '', 'utf-8')
    log.value = ''
    message.success(t('views.pluginCenter.logFileCleared'))
  } catch (error) {
    message.error(t('views.pluginCenter.logFileClearError'))
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
    style="width: 400px"
    preset="card"
    :title="$t('views.pluginCenter.logs')"
    :on-after-leave="handleNegative"
    :mask-closable="false"
  >
    <n-log ref="logRef" :log="log" :loading="loading" trim />
    <template #footer>
      <n-flex>
        <n-button size="small" @click="handleClearLog">
          {{ t('common.clear') }}
        </n-button>
        <n-button size="small" @click="getLogs">
          {{ t('common.refresh') }}
        </n-button>
        <n-button size="small" @click="visible = false">
          {{ t('common.cancel') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { i18n } from '@renderer/locales'

const { t } = i18n.global

const version = ref('')
const newVersion = ref('')
const downloading = ref(false)
const checkLoading = ref(false)

async function getCurrentVersion() {
  version.value = await window.ipc.update.getCurrentVersion()
}
getCurrentVersion()

async function checkForUpdate() {
  if (checkLoading.value) return
  try {
    checkLoading.value = true
    const result = await window.ipc.update.check()

    if (result) {
      newVersion.value = result
      ElMessage({
        message: t('update.findNewVersion') + ' v' + result,
        type: 'success',
        plain: true,
      })
    } else {
      newVersion.value = ''
      ElMessage({
        message: t('update.newVersionNotFound'),
        type: 'info',
        plain: true,
      })
    }
  } catch (err) {
    console.error(err)
  } finally {
    checkLoading.value = false
  }
}

async function downloadUpdate() {
  try {
    downloading.value = true
    await window.ipc.update.download()
  } catch (err) {
    console.error(err)
  } finally {
    downloading.value = false
  }
}

export function useAppUpdate() {
  return {
    version,
    newVersion,
    downloading,
    checkLoading,
    checkForUpdate,
    downloadUpdate,
  }
}

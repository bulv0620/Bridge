import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'
import { i18n } from '@renderer/locales'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref } from 'vue'
import { createRendererLogger } from '@renderer/utils/logger'

const { t } = i18n.global
const logLevel = useRemoteRef<LogLevel>('log-level', 'info')
const status = ref<DiagnosticsStatus>({
  directory: '',
  sizeBytes: 0,
})
type DiagnosticsAction = 'open' | 'export' | 'clear'
const loadingAction = ref<DiagnosticsAction>()
const isBusy = computed(() => loadingAction.value != null)
const logger = createRendererLogger('diagnostics')

async function refreshStatus() {
  try {
    status.value = await window.ipc.log.getDiagnosticsStatus()
  } catch (error) {
    logger.error('diagnostics.status.failed', error)
  }
}

async function openDirectory() {
  loadingAction.value = 'open'
  try {
    await window.ipc.log.openDirectory()
  } catch {
    logger.error('diagnostics.directory.open_failed', new Error('Failed to open log directory'))
    ElMessage({
      message: t('views.setting.diagnostics.openFailed'),
      type: 'error',
      plain: true,
    })
  } finally {
    loadingAction.value = undefined
  }
}

async function exportDiagnostics() {
  loadingAction.value = 'export'
  try {
    const result = await window.ipc.log.exportDiagnostics()
    if (!result.cancelled) {
      ElMessage({
        message: t('views.setting.diagnostics.exportSuccess'),
        type: 'success',
        plain: true,
      })
    }
  } catch {
    ElMessage({
      message: t('views.setting.diagnostics.exportFailed'),
      type: 'error',
      plain: true,
    })
  } finally {
    loadingAction.value = undefined
    await refreshStatus()
  }
}

async function clearLogs() {
  try {
    await ElMessageBox({
      type: 'warning',
      title: t('common.warning'),
      message: t('views.setting.diagnostics.clearConfirm'),
      showCancelButton: true,
    })
  } catch {
    return
  }

  loadingAction.value = 'clear'
  try {
    await window.ipc.log.clear()
    await refreshStatus()
    ElMessage({
      message: t('views.setting.diagnostics.clearSuccess'),
      type: 'success',
      plain: true,
    })
  } catch {
    ElMessage({
      message: t('views.setting.diagnostics.clearFailed'),
      type: 'error',
      plain: true,
    })
  } finally {
    loadingAction.value = undefined
  }
}

export function useDiagnostics() {
  return {
    logLevel,
    status,
    loadingAction,
    isBusy,
    refreshStatus,
    openDirectory,
    exportDiagnostics,
    clearLogs,
  }
}

<script setup lang="ts">
import { computed, onActivated, onDeactivated, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatBytes } from '@renderer/utils/format'
import { useDiagnostics } from '@renderer/composables/setting/useDiagnostics'
import { Delete, Download, FolderOpened } from '@element-plus/icons-vue'
import SegmentedControl from './SegmentedControl.vue'

const props = defineProps<{
  active: boolean
}>()

const { t } = useI18n()
const {
  logLevel,
  status,
  loadingAction,
  isBusy,
  refreshStatus,
  openDirectory,
  exportDiagnostics,
  clearLogs,
} = useDiagnostics()
const logLevelOptions = computed(() => [
  { label: t('views.setting.diagnostics.standard'), value: 'info' },
  { label: t('views.setting.diagnostics.detailed'), value: 'debug' },
])

let wasDeactivated = false

watch(
  () => props.active,
  (active) => {
    if (active) void refreshStatus()
  },
  { immediate: true },
)

onDeactivated(() => {
  wasDeactivated = true
})

onActivated(() => {
  if (wasDeactivated && props.active) void refreshStatus()
  wasDeactivated = false
})
</script>

<template>
  <section class="diagnostics-settings" :aria-label="$t('views.setting.logsTab')">
    <div class="setting-row">
      <span id="log-level-label" class="row-label">
        {{ $t('views.setting.diagnostics.level') }}
      </span>
      <SegmentedControl
        v-model:value="logLevel"
        :options="logLevelOptions"
        labelledby="log-level-label"
      />
    </div>

    <div class="action-row">
      <div class="file-actions">
        <el-button
          :icon="FolderOpened"
          :loading="loadingAction === 'open'"
          :disabled="isBusy"
          @click="openDirectory"
        >
          {{ $t('views.setting.diagnostics.openDirectory') }}
        </el-button>
        <el-button
          type="primary"
          :icon="Download"
          :loading="loadingAction === 'export'"
          :disabled="isBusy"
          @click="exportDiagnostics"
        >
          {{ $t('views.setting.diagnostics.export') }}
        </el-button>
      </div>
      <div class="storage-actions">
        <span class="storage">
          {{ $t('views.setting.diagnostics.storage') }}
          <strong>{{ formatBytes(status.sizeBytes) }}</strong>
          <small>{{ $t('views.setting.diagnostics.storageLimit') }}</small>
        </span>
        <el-tooltip :content="$t('views.setting.diagnostics.clear')" placement="top">
          <el-button
            class="clear-button"
            type="danger"
            link
            :icon="Delete"
            :aria-label="$t('views.setting.diagnostics.clear')"
            :loading="loadingAction === 'clear'"
            :disabled="isBusy"
            @click="clearLogs"
          />
        </el-tooltip>
      </div>
    </div>

    <p class="privacy-note">{{ $t('views.setting.diagnostics.privacy') }}</p>
  </section>
</template>

<style scoped lang="less">
.diagnostics-settings {
  margin-bottom: 16px;
  padding: 24px;
  border-radius: var(--bridge-radius-lg);
  background: var(--bridge-surface-soft);
  box-shadow: inset 0 0 0 1px var(--bridge-stroke);

  .setting-row,
  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .storage {
    display: flex;
    align-items: baseline;
    gap: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-variant-numeric: tabular-nums;

    strong {
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 600;
    }

    small {
      color: var(--el-text-color-secondary);
      font-size: 11px;
    }
  }

  .action-row {
    margin-top: 20px;
    padding-top: 20px;
    box-shadow: inset 0 1px 0 var(--bridge-stroke);
  }

  .row-label {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 600;
  }

  .file-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .storage-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .clear-button {
    width: 36px;
    padding: 0;
  }

  .privacy-note {
    margin: 16px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 1.5;
  }

  :deep(.el-button) {
    min-height: 36px;
  }

  :deep(.el-button.is-link) {
    min-height: 32px;
  }

  :deep(.el-button:focus-visible) {
    outline: 2px solid var(--el-color-primary-light-5);
    outline-offset: 2px;
  }

}

@media (max-width: 620px) {
  .diagnostics-settings {
    padding: 18px;

    .action-row {
      align-items: flex-start;
      flex-direction: column;
    }
  }
}
</style>

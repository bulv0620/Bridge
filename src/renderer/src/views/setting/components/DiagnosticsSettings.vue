<script setup lang="ts">
import { onActivated, onDeactivated, watch } from 'vue'
import { formatBytes } from '@renderer/utils/format'
import { useDiagnostics } from '@renderer/composables/setting/useDiagnostics'
import { Delete, Download, FolderOpened } from '@element-plus/icons-vue'

const props = defineProps<{
  active: boolean
}>()

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
      <el-radio-group
        v-model="logLevel"
        class="level-options"
        :class="{ 'is-detailed': logLevel === 'debug' }"
        aria-labelledby="log-level-label"
      >
        <el-radio-button value="info">
          {{ $t('views.setting.diagnostics.standard') }}
        </el-radio-button>
        <el-radio-button value="debug">
          {{ $t('views.setting.diagnostics.detailed') }}
        </el-radio-button>
      </el-radio-group>
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

  .level-options {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(64px, 1fr));
    padding: 3px;
    overflow: hidden;
    isolation: isolate;
    border-radius: 10px;
    background: var(--el-fill-color);
    box-shadow: inset 0 0 0 1px var(--bridge-stroke);

    &::before {
      content: '';
      position: absolute;
      z-index: 0;
      top: 3px;
      bottom: 3px;
      left: 3px;
      width: calc(50% - 3px);
      border-radius: 8px;
      background: var(--bridge-surface);
      box-shadow:
        0 1px 3px rgba(20, 28, 42, 0.12),
        0 1px 1px rgba(20, 28, 42, 0.06);
      transition: transform var(--bridge-motion);
    }

    &.is-detailed::before {
      transform: translateX(100%);
    }

    :deep(.el-radio-button) {
      z-index: 1;
      cursor: pointer;
    }

    :deep(.el-radio-button__inner) {
      width: 100%;
      height: 32px;
      padding: 0 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0 !important;
      border-radius: 7px !important;
      color: var(--el-text-color-secondary);
      background: transparent !important;
      box-shadow: none !important;
      font-weight: 500;
      line-height: 1;
      transition: color var(--bridge-motion);
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      color: var(--el-text-color-primary);
      background: transparent !important;
      box-shadow: none !important;
    }

    :deep(.el-radio-button__original-radio:focus-visible + .el-radio-button__inner) {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
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

  @media (prefers-reduced-motion: reduce) {
    .level-options::before,
    .level-options :deep(.el-radio-button__inner) {
      transition: none;
    }
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

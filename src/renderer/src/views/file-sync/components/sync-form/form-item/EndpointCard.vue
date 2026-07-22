<script setup lang="ts">
import { ref, computed, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Close, ArrowLeft } from '@element-plus/icons-vue'
import FtpSvg from '@renderer/assets/svg/ftp.svg'
import BucketSvg from '@renderer/assets/svg/bucket.svg'
import DiskSvg from '@renderer/assets/svg/disk.svg'
import NotSelectedSvg from '@renderer/assets/svg/not-selected.svg'

import { useConectionModal } from '@renderer/composables/file-sync/useConnectionModal'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { formatBytes } from '@renderer/utils/format'

const props = defineProps<{ type: 'source' | 'destination' }>()
const endpoint = defineModel<StorageEngineConfig | null>('endpoint', { required: true })

const { activeSessionState } = useActiveSyncSession()

const { t } = useI18n()
const { openConnectionModal } = useConectionModal()

const isSelecting = ref(false)

const title = computed(() =>
  props.type === 'source' ? t('views.fileSync.syncSource') : t('views.fileSync.syncDestination'),
)

const endPointOptions = computed(() => [
  { label: t('views.fileSync.local'), key: 'local', icon: DiskSvg },
  { label: t('views.fileSync.ftp'), key: 'ftp', icon: FtpSvg },
  { label: t('views.fileSync.s3'), key: 's3', icon: BucketSvg },
])

const capacity = computed(() => {
  if (!endpoint.value || !endpoint.value.storageCapacity) return null
  return endpoint.value.storageCapacity
})

const customColors = [
  { color: '#409eff', percentage: 75 },
  { color: '#e6a23c', percentage: 90 },
  { color: '#f56c6c', percentage: 100 },
]

function calcPercent(numerator: number, denominator: number, digits: number = 2): number {
  if (!denominator || denominator === 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(digits))
}

async function selectStorageType(key: StorageType) {
  isSelecting.value = false // Close overlay
  if (key === 'local') {
    const path = await window.ipc.file.selectFolder()
    if (path) endpoint.value = { storageType: 'local', path: path }
  } else {
    const config = await openConnectionModal(key)
    if (config) endpoint.value = config
  }
}

function removeEndPoint(e: Event) {
  e.stopPropagation()
  endpoint.value = null
}

async function handleClickCard() {
  if (activeSessionState.value?.isComparing || activeSessionState.value?.isSyncing) {
    return
  }
  if (endpoint.value) {
    if (endpoint.value.storageType === 'local') {
      const path = await window.ipc.file.selectFolder()
      if (path) endpoint.value = { storageType: 'local', path }
    } else {
      const config = await openConnectionModal(
        endpoint.value.storageType,
        toRaw(endpoint.value.connectionConfig),
      )
      if (config) endpoint.value = config
    }
  } else {
    isSelecting.value = true
  }
}

watch(activeSessionState, () => {
  isSelecting.value = false
})
</script>

<template>
  <div
    class="endpoint-card"
    :class="{ disabled: activeSessionState?.isSyncing || activeSessionState?.isComparing }"
    @click="handleClickCard"
  >
    <div class="card-content-wrapper">
      <div class="card-main">
        <div class="endpoint-image">
          <NotSelectedSvg v-if="!endpoint" style="width: 32px; height: 32px" />
          <template v-else>
            <FtpSvg v-if="endpoint.storageType === 'ftp'" style="width: 32px; height: 32px" />
            <BucketSvg
              v-else-if="endpoint.storageType === 's3'"
              style="width: 32px; height: 32px"
            />
            <DiskSvg v-else style="width: 32px; height: 32px" />
          </template>
        </div>

        <div class="detail">
          <el-text truncated class="card-title">
            {{ endpoint?.storageType.toUpperCase() ?? title }}
          </el-text>
          <el-text truncated class="card-path" :title="endpoint?.path">
            {{ endpoint?.path ?? $t('views.fileSync.notSelected') }}
          </el-text>
        </div>

        <div class="actions">
          <el-button
            v-if="endpoint"
            :disabled="activeSessionState!.isSyncing || activeSessionState!.isComparing"
            :icon="Close"
            circle
            size="small"
            @click="removeEndPoint"
          />
        </div>
      </div>

      <div class="capacity-footer">
        <div class="footer-info">
          <span>{{ $t('views.fileSync.capacity') }}</span>
          <span v-if="capacity" class="nums">
            {{ formatBytes(capacity.used) }} / {{ formatBytes(capacity.total) }}
          </span>
        </div>
        <el-progress
          :percentage="capacity ? calcPercent(capacity.used, capacity.total, 1) : 0"
          :stroke-width="3"
          :show-text="false"
          :color="customColors"
        />
      </div>
    </div>

    <Transition name="slide-up">
      <div v-if="isSelecting && !endpoint" class="selection-overlay" @click.stop>
        <div class="overlay-header">
          <el-button :icon="ArrowLeft" link size="small" @click="isSelecting = false">
            {{ $t('common.back') }}
          </el-button>
        </div>
        <div class="options-grid">
          <div
            v-for="opt in endPointOptions"
            :key="opt.key"
            class="option-item"
            @click="selectStorageType(opt.key as StorageType)"
          >
            <component :is="opt.icon" class="option-icon" />
            <span class="option-label">{{ opt.label }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="less" scoped>
.endpoint-card {
  position: relative; // Required for absolute overlay
  flex: 1;
  overflow: hidden;
  min-width: 0;
  border-radius: var(--bridge-radius-md);
  border: 1px solid var(--bridge-stroke);
  background: var(--bridge-surface-soft);
  display: flex;
  flex-direction: column;
  transition:
    background var(--bridge-motion),
    border-color var(--bridge-motion);
  cursor: pointer;

  &:hover {
    border-color: var(--el-color-primary-light-7);
    background: var(--bridge-surface);
  }

  &.disabled {
    cursor: not-allowed;

    &:hover {
      border-color: var(--bridge-stroke);
      background: var(--bridge-surface-soft);
    }
  }
}

.card-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-main {
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;

  .endpoint-image {
    flex-shrink: 0;
    opacity: 0.85;
  }

  .detail {
    flex: 1;
    overflow: hidden;

    .card-title {
      font-weight: 600;
      color: var(--el-text-color-primary);
      display: block;
      height: 20px;
    }

    .card-path {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      display: block;
      margin-top: 4px;
      height: 18px;
    }
  }
}

.capacity-footer {
  background: color-mix(in srgb, var(--bridge-surface-hover) 64%, transparent);
  padding: 7px 12px 9px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .footer-info {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    height: 12px;

    .nums {
      font-family: monospace;
    }
  }
}

.selection-overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  background: var(--bridge-surface);
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 4px;

  .overlay-header {
    margin-bottom: 4px;
  }

  .options-grid {
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex: 1;
    overflow: hidden;

    .option-item {
      height: 100%;
      min-width: 44px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      transition:
        color var(--bridge-motion),
        background var(--bridge-motion);
      flex: 1;

      &:hover {
        background: var(--el-fill-color);
        color: var(--el-color-primary);
      }

      .option-icon {
        width: 24px;
        height: 24px;
      }

      .option-label {
        font-size: 12px;
        font-weight: 500;
      }
    }
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(10px);
  opacity: 0;
}
</style>

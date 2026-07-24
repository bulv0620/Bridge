<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Close, FolderOpened, Loading, WarningFilled } from '@element-plus/icons-vue'
import FtpSvg from '@renderer/assets/svg/ftp.svg'
import BucketSvg from '@renderer/assets/svg/bucket.svg'
import DiskSvg from '@renderer/assets/svg/disk.svg'
import NotSelectedSvg from '@renderer/assets/svg/not-selected.svg'

import { useConectionModal } from '@renderer/composables/file-sync/useConnectionModal'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { formatBytes } from '@renderer/utils/format'

const props = defineProps<{ type: 'source' | 'destination' }>()
const endpoint = defineModel<StorageEngineConfig | null>('endpoint', { required: true })

const { activeSession, activeSessionState } = useActiveSyncSession()
const { t } = useI18n()
const { openConnectionModal } = useConectionModal()

const isSelecting = ref(false)
const isCapacityPopoverVisible = ref(false)
const showCapacityLoading = ref(false)
let loadingTimer: ReturnType<typeof setTimeout> | undefined

const title = computed(() =>
  props.type === 'source' ? t('views.fileSync.syncSource') : t('views.fileSync.syncDestination'),
)

const endPointOptions = computed(() => [
  { label: t('views.fileSync.local'), key: 'local', icon: DiskSvg },
  { label: t('views.fileSync.ftp'), key: 'ftp', icon: FtpSvg },
  { label: t('views.fileSync.s3'), key: 's3', icon: BucketSvg },
])

const capacityState = computed<StorageCapacityState>(
  () => activeSessionState.value?.capacityStates[props.type] ?? { status: 'idle' },
)

const capacity = computed(() =>
  capacityState.value.status === 'ready' ? capacityState.value.capacity : null,
)

const capacityPercent = computed(() => {
  if (!capacity.value?.total) return 0
  return Math.min(
    100,
    Math.max(0, Number(((capacity.value.used / capacity.value.total) * 100).toFixed(1))),
  )
})

const availableCapacity = computed(() =>
  capacity.value ? Math.max(capacity.value.total - capacity.value.used, 0) : 0,
)

const capacityColor = computed(() => {
  if (capacityPercent.value >= 90) return 'var(--el-color-danger)'
  if (capacityPercent.value >= 75) return 'var(--el-color-warning)'
  return 'var(--el-color-primary)'
})

const capacityAriaLabel = computed(() =>
  t('views.fileSync.capacityUsedAria', { percent: capacityPercent.value }),
)

function clearLoadingTimer() {
  if (loadingTimer) {
    clearTimeout(loadingTimer)
    loadingTimer = undefined
  }
}

watch(
  () => capacityState.value.status,
  (status) => {
    clearLoadingTimer()
    showCapacityLoading.value = false
    isCapacityPopoverVisible.value = false

    if (status === 'loading') {
      loadingTimer = setTimeout(() => {
        if (capacityState.value.status === 'loading') {
          showCapacityLoading.value = true
        }
      }, 300)
    }
  },
  { immediate: true },
)

async function selectStorageType(key: StorageType) {
  isSelecting.value = false
  if (key === 'local') {
    const path = await window.ipc.file.selectFolder()
    if (path) endpoint.value = { storageType: 'local', path }
  } else {
    const config = await openConnectionModal(key)
    if (config) endpoint.value = config
  }
}

function removeEndPoint(e: Event) {
  e.stopPropagation()
  isCapacityPopoverVisible.value = false
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

function retryCapacity() {
  isCapacityPopoverVisible.value = false
  void activeSession.value?.refreshCapacity(props.type)
}

function handleEscape() {
  isSelecting.value = false
  isCapacityPopoverVisible.value = false
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleEscape()
  }
}

watch(activeSessionState, () => {
  isSelecting.value = false
  isCapacityPopoverVisible.value = false
})

onMounted(() => window.addEventListener('keydown', handleDocumentKeydown, true))
onBeforeUnmount(() => {
  clearLoadingTimer()
  window.removeEventListener('keydown', handleDocumentKeydown, true)
})
</script>

<template>
  <div
    class="endpoint-card"
    :class="{
      disabled: activeSessionState?.isSyncing || activeSessionState?.isComparing,
    }"
    @click="handleClickCard"
    @keydown.esc.stop="handleEscape"
  >
    <div class="card-main">
      <div
        class="endpoint-image"
        :class="{ 'empty-image': !endpoint, 'selected-image': endpoint }"
        aria-hidden="true"
      >
        <NotSelectedSvg v-if="!endpoint" />
        <template v-else>
          <FtpSvg v-if="endpoint.storageType === 'ftp'" />
          <BucketSvg v-else-if="endpoint.storageType === 's3'" />
          <DiskSvg v-else />
        </template>
      </div>

      <div class="detail">
        <template v-if="endpoint">
          <div class="endpoint-heading">
            <span class="card-title">{{ endpoint.storageType.toUpperCase() }}</span>
            <span class="endpoint-separator" aria-hidden="true">·</span>
            <span class="endpoint-role">{{ title }}</span>
          </div>
          <div class="path-row" :title="endpoint.path">
            <el-icon class="path-icon"><FolderOpened /></el-icon>
            <span class="path-text">{{ endpoint.path }}</span>
          </div>
        </template>
        <template v-else>
          <div class="empty-detail">
            <span class="card-title">{{ title }}</span>
            <span class="empty-hint">{{ $t('views.fileSync.selectStorageHint') }}</span>
          </div>
        </template>
      </div>

      <div v-if="endpoint" class="actions" @click.stop>
        <button
          type="button"
          class="remove-trigger"
          :disabled="activeSessionState!.isSyncing || activeSessionState!.isComparing"
          :aria-label="$t('views.fileSync.removeEndpoint')"
          :title="$t('views.fileSync.removeEndpoint')"
          @click="removeEndPoint"
        >
          <span class="remove-visual">
            <el-icon><Close /></el-icon>
          </span>
        </button>

        <div v-if="endpoint.storageType === 'local'" class="capacity-slot">
          <el-popover
            v-if="capacityState.status === 'ready' || capacityState.status === 'unavailable'"
            v-model:visible="isCapacityPopoverVisible"
            placement="top-end"
            :width="224"
            trigger="click"
          >
            <template #default>
              <div
                class="capacity-popover"
                @click.stop
                @keydown.esc.stop="isCapacityPopoverVisible = false"
              >
                <div class="capacity-popover-title">
                  {{ $t('views.fileSync.capacityDetails') }}
                </div>

                <template v-if="capacity">
                  <dl class="capacity-list">
                    <div>
                      <dt>{{ $t('views.fileSync.totalCapacity') }}</dt>
                      <dd>{{ formatBytes(capacity.total) }}</dd>
                    </div>
                    <div>
                      <dt>{{ $t('views.fileSync.usedCapacity') }}</dt>
                      <dd>{{ formatBytes(capacity.used) }}</dd>
                    </div>
                    <div>
                      <dt>{{ $t('views.fileSync.availableCapacity') }}</dt>
                      <dd>{{ formatBytes(availableCapacity) }}</dd>
                    </div>
                    <div>
                      <dt>{{ $t('views.fileSync.usedPercentage') }}</dt>
                      <dd>{{ capacityPercent }}%</dd>
                    </div>
                  </dl>
                </template>

                <div v-else class="capacity-unavailable">
                  <p>{{ $t('views.fileSync.capacityUnavailable') }}</p>
                  <el-button link type="primary" @click.stop="retryCapacity">
                    {{ $t('views.fileSync.retryCapacity') }}
                  </el-button>
                </div>
              </div>
            </template>

            <template #reference>
              <button
                v-if="capacityState.status === 'ready'"
                type="button"
                class="capacity-trigger"
                :aria-label="capacityAriaLabel"
                :title="capacityAriaLabel"
                @click.stop
              >
                <el-progress
                  type="circle"
                  :percentage="capacityPercent"
                  :width="24"
                  :stroke-width="4"
                  :show-text="false"
                  :color="capacityColor"
                />
              </button>
              <button
                v-else
                type="button"
                class="capacity-trigger capacity-warning"
                :aria-label="$t('views.fileSync.capacityUnavailable')"
                :title="$t('views.fileSync.capacityUnavailable')"
                @click.stop
              >
                <el-icon><WarningFilled /></el-icon>
              </button>
            </template>
          </el-popover>

          <div
            v-else-if="capacityState.status === 'loading' && showCapacityLoading"
            class="capacity-loading"
            role="status"
            :aria-label="$t('views.fileSync.capacityLoading')"
          >
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <Transition name="slide-up">
      <div v-if="isSelecting && !endpoint" class="selection-overlay" @click.stop>
        <div class="options-grid">
          <button
            v-for="opt in endPointOptions"
            :key="opt.key"
            type="button"
            class="option-item"
            @click="selectStorageType(opt.key as StorageType)"
          >
            <component :is="opt.icon" class="option-icon" aria-hidden="true" />
            <span class="option-label">{{ opt.label }}</span>
          </button>
        </div>
        <button
          type="button"
          class="selection-close"
          :aria-label="$t('views.fileSync.closeStorageSelection')"
          :title="$t('views.fileSync.closeStorageSelection')"
          @click="isSelecting = false"
        >
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style lang="less" scoped>
.endpoint-card {
  position: relative;
  flex: 1;
  overflow: hidden;
  min-width: 0;
  height: 104px;
  min-height: 104px;
  max-height: 104px;
  border-radius: var(--bridge-radius-md);
  border: 1px solid var(--bridge-stroke);
  background: var(--bridge-surface-soft);
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

.card-main {
  height: 100%;
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.endpoint-image {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  opacity: 0.85;

  :deep(svg) {
    width: 32px;
    height: 32px;
  }
}

.empty-image {
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  opacity: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

.selected-image {
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-color-primary) 9%, transparent);
  color: var(--el-color-primary);
  opacity: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    width: 28px;
    height: 28px;
  }
}

.detail {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.endpoint-heading {
  height: 22px;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.card-title {
  display: block;
  height: 20px;
  line-height: 20px;
  flex-shrink: 0;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.endpoint-role {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

.endpoint-separator {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.empty-detail {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.empty-hint {
  display: block;
  height: 18px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.path-row {
  box-sizing: border-box;
  height: 28px;
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px solid color-mix(in srgb, var(--bridge-stroke) 78%, transparent);
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
}

.path-icon {
  flex-shrink: 0;
  font-size: 13px;
}

.path-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.actions {
  align-self: center;
  flex: 0 0 44px;
  width: 44px;
  height: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.remove-trigger {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover:not(:disabled) .remove-visual {
    border-color: var(--el-border-color-darker);
    background: var(--el-fill-color);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.remove-visual {
  box-sizing: border-box;
  width: 30px;
  height: 30px;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  background: var(--bridge-surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition:
    border-color var(--bridge-motion),
    background var(--bridge-motion);
}

.capacity-slot,
.capacity-trigger,
.capacity-loading {
  width: 44px;
  height: 44px;
}

.capacity-trigger {
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color var(--bridge-motion);

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 1px;
  }

  :deep(*) {
    cursor: pointer;
  }
}

.capacity-trigger :deep(.el-progress-circle__track) {
  stroke: color-mix(in srgb, var(--el-text-color-secondary) 34%, transparent);
}

.capacity-warning {
  color: var(--el-color-warning);
  font-size: 18px;
}

.capacity-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 18px;
}

.capacity-popover {
  color: var(--el-text-color-primary);
}

.capacity-popover-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
}

.capacity-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;

  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  dt {
    color: var(--el-text-color-secondary);
  }

  dd {
    margin: 0;
    font-family: monospace;
    font-variant-numeric: tabular-nums;
  }
}

.capacity-unavailable {
  color: var(--el-text-color-secondary);

  p {
    margin: 0 0 8px;
    line-height: 1.5;
  }
}

.selection-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  padding: 8px;
  background: var(--bridge-surface);
  display: flex;
  align-items: stretch;
}

.options-grid {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.option-item,
.selection-close {
  border: 0;
  color: var(--el-text-color-regular);
  background: transparent;
  cursor: pointer;
  transition:
    color var(--bridge-motion),
    background var(--bridge-motion);

  &:hover {
    background: var(--el-fill-color);
    color: var(--el-color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -2px;
  }
}

.option-item {
  min-width: 0;
  min-height: 44px;
  padding: 8px 4px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 7px;

  .option-icon {
    width: 24px;
    height: 24px;
  }

  .option-label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 500;
  }
}

.selection-close {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  margin-left: 4px;
  align-self: center;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: opacity 0.01ms;
  }
}
</style>

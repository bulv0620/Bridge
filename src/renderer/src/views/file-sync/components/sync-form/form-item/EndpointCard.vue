<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FtpSvg from '@renderer/assets/svg/ftp.svg'
import BucketSvg from '@renderer/assets/svg/bucket.svg'
import DiskSvg from '@renderer/assets/svg/disk.svg'
import NotSelectedSvg from '@renderer/assets/svg/not-selected.svg'
import { Close, MoreFilled } from '@element-plus/icons-vue'
import { useConectionModal } from '@renderer/composables/file-sync/useConnectionModal'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { formatBytes } from '@renderer/utils/format'

const props = defineProps<{ type: 'source' | 'destination' }>()
const endpoint = defineModel<StorageEngineConfig | null>('endpoint', { required: true })

const { activeSessionState } = useActiveSyncSession()
const { t } = useI18n()
const { openConnectionModal } = useConectionModal()

const title = computed(() =>
  props.type === 'source' ? t('views.fileSync.syncSource') : t('views.fileSync.syncDestination'),
)

const endPointOptions = computed(() => [
  { label: t('views.fileSync.local'), key: 'local' },
  { label: t('views.fileSync.ftp'), key: 'ftp' },
  { label: t('views.fileSync.s3'), key: 's3' },
])

const capacity = computed(() => {
  if (!endpoint.value || !endpoint.value.storageCapacity) {
    return null
  }

  return endpoint.value.storageCapacity
})

// 进度条颜色
const customColors = [
  { color: '#409eff', percentage: 75 }, // 蓝色起步
  { color: '#e6a23c', percentage: 90 },
  { color: '#f56c6c', percentage: 100 },
]

function calcPercent(numerator: number, denominator: number, digits: number = 2): number {
  if (!denominator || denominator === 0) return 0
  const ratio = numerator / denominator
  return Number((ratio * 100).toFixed(digits))
}

async function selectStorageType(key: StorageType) {
  if (key === 'local') {
    const path = await window.ipc.file.selectFolder()
    if (path) endpoint.value = { storageType: 'local', path: path }
  } else {
    const config = await openConnectionModal(key)
    endpoint.value = config
  }
}

function removeEndPoint() {
  endpoint.value = null
}
</script>

<template>
  <div class="endpoint-card" :class="{ active: !!endpoint }">
    <div class="card-main">
      <div class="endpoint-image">
        <NotSelectedSvg v-if="!endpoint" style="width: 32px; height: 32px"></NotSelectedSvg>
        <template v-else>
          <FtpSvg v-if="endpoint.storageType === 'ftp'" style="width: 32px; height: 32px"></FtpSvg>
          <BucketSvg
            v-else-if="endpoint.storageType === 's3'"
            style="width: 32px; height: 32px"
          ></BucketSvg>
          <DiskSvg v-else style="width: 32px; height: 32px"></DiskSvg>
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
          :disabled="activeSessionState.isSyncing || activeSessionState.isComparing"
          :icon="Close"
          circle
          size="small"
          @click="removeEndPoint"
        />
        <el-dropdown
          v-else
          trigger="click"
          :disabled="activeSessionState.isComparing || activeSessionState.isSyncing"
          @command="selectStorageType"
        >
          <el-button :icon="MoreFilled" circle size="small"></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="opt in endPointOptions" :key="opt.key" :command="opt.key">
                {{ opt.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="capacity-footer">
      <div class="footer-info">
        <span>{{ $t('views.fileSync.capacity') }}</span>
        <span v-if="capacity" class="nums">
          {{ formatBytes(capacity.used) }} / {{ formatBytes(capacity.total) }}
        </span>
        <span v-else class="nums"></span>
      </div>
      <el-progress
        :percentage="capacity ? calcPercent(capacity.used, capacity.total, 1) : 0"
        :stroke-width="3"
        :show-text="false"
        :color="customColors"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.endpoint-card {
  flex: 1;
  overflow: hidden;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  transition: all 0.2s;

  &.active {
    border-color: var(--el-border-color); // 激活时边框稍微深一点
  }
}

.card-main {
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: center;

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
    }

    .card-path {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      display: block;
      margin-top: 4px;
    }
  }

  .actions {
    flex-shrink: 0;
  }
}

.capacity-footer {
  /* 只有激活且有数据时才显示这个区块 */
  background: var(--el-fill-color); /* 比卡片背景稍深一点，形成区块感 */
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .footer-info {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    line-height: 1;

    .nums {
      font-weight: 500;
    }
  }
}
</style>

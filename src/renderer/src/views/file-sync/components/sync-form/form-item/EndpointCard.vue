<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FtpSvg from '@renderer/assets/svg/ftp.svg'
import BucketSvg from '@renderer/assets/svg/bucket.svg'
import DiskSvg from '@renderer/assets/svg/disk.svg'
import NotSelectedSvg from '@renderer/assets/svg/not-selected.svg'
import { Close } from '@vicons/ionicons5'
import { useConectionModal } from '@renderer/composables/file-sync/useConnectionModal'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'

const props = defineProps<{
  type: 'source' | 'destination'
}>()

const endpoint = defineModel<StorageEngineConfig | null>('endpoint', { required: true })

const { activeSessionState, activeSession } = useActiveSyncSession()
const { t } = useI18n()
const { openConnectionModal } = useConectionModal()

const title = computed(() => {
  if (props.type === 'source') {
    return t('views.fileSync.syncSource')
  } else {
    return t('views.fileSync.syncDestination')
  }
})

const endPointOptions = computed(() => [
  {
    label: t('views.fileSync.local'),
    key: 'local',
  },
  {
    label: t('views.fileSync.ftp'),
    key: 'ftp',
  },
  {
    label: t('views.fileSync.s3'),
    key: 's3',
  },
])

async function selectStorageType(key: StorageType) {
  if (key === 'local') {
    const path = await window.ipc.file.selectFolder()
    if (path) {
      endpoint.value = {
        storageType: 'local',
        path: path,
      }
    }
  } else {
    const config = await openConnectionModal(key)
    endpoint.value = config
  }

  activeSession.value.handleConfigChange(props.type)
}

function removeEndPoint() {
  endpoint.value = null
  activeSession.value.handleConfigChange(props.type)
}
</script>

<template>
  <div class="endpoint-card" :class="{ active: !!endpoint }">
    <div class="card-content">
      <div class="endpoint-image">
        <SvgIcon v-if="!endpoint" :icon="NotSelectedSvg" :size="32"></SvgIcon>
        <template v-else>
          <SvgIcon v-if="endpoint.storageType === 'ftp'" :icon="FtpSvg" :size="32"></SvgIcon>
          <SvgIcon v-else-if="endpoint.storageType === 's3'" :icon="BucketSvg" :size="32"></SvgIcon>
          <SvgIcon v-else :icon="DiskSvg" :size="32"></SvgIcon>
        </template>
      </div>
      <div class="text">
        <el-text truncated style="width: 100%" type="primary">{{ title }}</el-text>
        <el-text v-if="endpoint" truncated style="width: 100%">
          {{ endpoint?.path }}
        </el-text>

        <el-dropdown
          v-else
          trigger="click"
          :disabled="activeSessionState.isComparing || activeSessionState.isSyncing"
          @command="selectStorageType"
        >
          <!-- 触发按钮 -->
          <el-text type="info" style="cursor: pointer; user-select: none">{{
            $t('views.fileSync.notSelected')
          }}</el-text>

          <!-- 下拉内容 -->
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="opt in endPointOptions" :key="opt.key" :command="opt.key">
                {{ opt.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <el-button
        v-if="endpoint"
        :disabled="activeSessionState.isSyncing || activeSessionState.isComparing"
        :icon="Close"
        circle
        text
        bg
        @click="removeEndPoint"
      >
      </el-button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.endpoint-card {
  flex: 1;
  overflow: hidden;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  padding: 12px;

  &.active {
    background: var(--el-bg-color);
  }
}

.card-content {
  display: flex;
  gap: 12px;
  align-items: center;

  .endpoint-image {
    user-select: none;
  }

  .text {
    flex: 1;
    overflow: hidden;
    line-height: normal;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: start;
    height: 40px;
  }
}
</style>

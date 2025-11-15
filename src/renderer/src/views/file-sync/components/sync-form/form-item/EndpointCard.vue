<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Drive from '@renderer/assets/imgs/drive.png'
import CloudDrive from '@renderer/assets/imgs/cloud_drive.png'
import Search from '@renderer/assets/imgs/search.png'
import { Close } from '@vicons/ionicons5'
import { useFtpConectionModal } from '@renderer/composables/file-sync/useFtpConnectionModal'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'

const props = defineProps<{
  type: 'source' | 'destination'
}>()

const endpoint = defineModel<StorageEngineConfig | null>('endpoint', { required: true })

const { isSyncing, isComparing } = useSyncForm()
const { t } = useI18n()
const { openFtpConnectionModal } = useFtpConectionModal()

const title = computed(() => {
  if (props.type === 'source') {
    return t('views.fileSync.syncSource')
  } else {
    return t('views.fileSync.syncDestination')
  }
})

const endPointImage = computed(() => {
  if (!endpoint.value) {
    return Search
  }
  if (endpoint.value?.storageType === 'local') {
    return Drive
  } else {
    return CloudDrive
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
])

async function selectStorageType(key: string) {
  if (key === 'local') {
    const path = await window.ipc.file.selectFolder()
    if (path) {
      endpoint.value = {
        storageType: 'local',
        path: path,
      }
    }
  } else if (key === 'ftp') {
    const config = await openFtpConnectionModal()
    endpoint.value = config
  }
}

function removeEndPoint() {
  endpoint.value = null
}
</script>

<template>
  <div class="endpoint-card" :class="{ active: !!endpoint }">
    <div class="card-content">
      <img class="endpoint-image" :src="endPointImage" draggable="false" />
      <div class="text">
        <el-text truncated style="width: 100%" type="primary">{{ title }}</el-text>
        <el-text v-if="endpoint" truncated style="width: 100%">
          {{ endpoint?.path }}
        </el-text>

        <el-dropdown
          v-else
          trigger="click"
          :disabled="isComparing || isSyncing"
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
        :disabled="isSyncing || isComparing"
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
  background: var(--el-fill-color);
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
    width: 32px;
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

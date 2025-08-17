<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Drive from '@renderer/assets/imgs/drive.png'
import CloudDrive from '@renderer/assets/imgs/cloud_drive.png'
import Search from '@renderer/assets/imgs/search.png'
import { Close } from '@vicons/ionicons5'
import { useFtpConectionModal } from '@renderer/composables/file-sync-v2/useFtpConnectionModal'

const props = defineProps<{
  type: 'source' | 'destination'
}>()

const endpoint = defineModel<StorageEngineConfig | null>('endpoint', { required: true })

const { t } = useI18n()
const { openFtpConnectionModal } = useFtpConectionModal()

const title = computed(() => {
  if (props.type === 'source') {
    return t('views.fileSyncV2.syncSource')
  } else {
    return t('views.fileSyncV2.syncDestination')
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
    label: t('views.fileSyncV2.local'),
    key: 'local',
  },
  {
    label: t('views.fileSyncV2.ftp'),
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
    openFtpConnectionModal()
  }
}

function removeEndPoint() {
  endpoint.value = null
}
</script>

<template>
  <n-card size="small" style="flex: 1; overflow: hidden">
    <div class="card-content">
      <img class="endpoint-image" :src="endPointImage" draggable="false" />
      <div class="text">
        <n-ellipsis style="width: 100%">
          <n-text :depth="3">{{ title }}</n-text>
        </n-ellipsis>
        <n-ellipsis v-if="endpoint" style="width: 100%">
          {{ endpoint?.path }}
        </n-ellipsis>
        <n-dropdown v-else trigger="hover" :options="endPointOptions" @select="selectStorageType">
          <n-a>{{ $t('views.fileSyncV2.notSelected') }}</n-a>
        </n-dropdown>
      </div>
      <n-button v-if="endpoint" type="text" size="small" @click="removeEndPoint">
        <template #icon>
          <Close></Close>
        </template>
      </n-button>
    </div>
  </n-card>
</template>

<style lang="less" scoped>
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
  }
}
</style>

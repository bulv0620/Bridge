<script setup lang="ts">
import { List, Pause, Play } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { useDiffList } from '@renderer/composables/file-sync/useDiffList'
import { useFolderWhiteList } from '@renderer/composables/file-sync/useFolderWhiteList'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { useFileSync } from '@renderer/composables/file-sync/useFileSync'

defineOptions({
  name: 'FileSync',
})

const { syncType, syncOptions } = useSyncForm()
const { diffTableData, hasWaitingFile } = useDiffList()
const { folderWhiteList, openWhiteListModal } = useFolderWhiteList()

const { syncProgressTxt, processing, pauseFlag, startSync, pauseSync } = useFileSync()
</script>

<template>
  <n-flex :wrap="false" align="center">
    <n-select
      v-model:value="syncType"
      :options="syncOptions"
      style="width: 180px"
      :disabled="processing"
    />
    <n-button v-if="processing" type="warning" :loading="pauseFlag" @click="pauseSync">
      <template #icon>
        <n-icon> <Pause /> </n-icon>
      </template>
      {{ $t('views.fileSync.stopSync') }}
    </n-button>
    <n-button v-else :disabled="diffTableData.length === 0 || !hasWaitingFile" @click="startSync">
      <template #icon>
        <n-icon> <Play /> </n-icon>
      </template>
      {{ $t('views.fileSync.startSync') }}
    </n-button>
    <n-button @click="openWhiteListModal">
      <template #icon>
        <n-icon> <List /> </n-icon>
      </template>
      {{ $t('views.fileSync.folderWhiteList') + ` ${folderWhiteList.length}` }}
    </n-button>

    <div style="margin-left: auto">
      {{ syncProgressTxt }}
    </div>
  </n-flex>
</template>

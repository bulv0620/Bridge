<script setup lang="ts">
import { FolderOutline } from '@vicons/ionicons5'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderInfo } from '@renderer/composables/file-sync/useSyncTool'
import { useFtpConfigModal } from '@renderer/composables/file-sync/useFtpConfigModal'

const ipcRenderer = window.electron.ipcRenderer

const props = withDefaults(
  defineProps<{
    type: 'target' | 'source'
    processing: boolean
  }>(),
  {},
)

const { openFtpConfigModal } = useFtpConfigModal()

const value = defineModel<FolderInfo>('value', { required: true })

const { t } = useI18n()

const placeholder = computed(() => {
  if (props.type === 'source') {
    return t('views.fileSync.sourceFolder')
  } else {
    return t('views.fileSync.targetFolder')
  }
})

const options = computed(() => [
  {
    label: t('views.fileSync.localFolder'),
    key: 'local',
  },
  {
    label: t('views.fileSync.ftpFolder'),
    key: 'ftp',
  },
])
const handleSelect = async (key: string) => {
  if (key === 'local') {
    const path = await ipcRenderer.invoke('select-folder')
    if (path) {
      value.value.type = 'local'
      value.value.path = path
      value.value.ftpConfig = undefined
    }
  } else if (key === 'ftp') {
    const conf = await openFtpConfigModal(value.value)
    if (!conf) return
    value.value.type = 'ftp'
    value.value.path = conf.path
    value.value.ftpConfig = conf.ftpConfig
  }
}
</script>

<template>
  <n-input-group>
    <n-input v-model:value="value.path" readonly :placeholder="placeholder">
      <template #prefix>
        <n-tag size="small" :type="value.type ? 'success' : ''">
          {{ value.type ? $t(`views.fileSync.${value.type}`) : $t('common.empty') }}
        </n-tag>
      </template>
    </n-input>
    <n-dropdown trigger="hover" :options="options" :disabled="processing" @select="handleSelect">
      <n-button>
        <template #icon>
          <n-icon> <FolderOutline /> </n-icon>
        </template>
      </n-button>
    </n-dropdown>
  </n-input-group>
</template>

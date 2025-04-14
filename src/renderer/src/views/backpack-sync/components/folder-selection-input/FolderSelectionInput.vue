<script setup lang="ts">
import { FolderOutline } from '@vicons/ionicons5'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FtpConfigModal, { FtpConfig } from '../ftp-config-modal/FtpConfigModal.vue'

const ipcRenderer = window.electron.ipcRenderer

export interface FolderInfo {
  type: 'local' | 'ftp' | ''
  path: string
  ftpConfig?: FtpConfig
}

const props = withDefaults(
  defineProps<{
    type: 'target' | 'source'
  }>(),
  {},
)

const value = defineModel<FolderInfo>('value', { required: true })
const ftpConfigModalRef = ref<InstanceType<typeof FtpConfigModal> | null>(null)

const { t } = useI18n()

const placeholder = computed(() => {
  if (props.type === 'source') {
    return t('views.backpack.sourceFolder')
  } else {
    return t('views.backpack.targetFolder')
  }
})

const options = computed(() => [
  {
    label: t('views.backpack.localFolder'),
    key: 'local',
  },
  {
    label: t('views.backpack.ftpFolder'),
    key: 'ftp',
  },
])
const handleSelect = async (key: string) => {
  if (key === 'local') {
    const path = await ipcRenderer.invoke('select-folder')
    if (path) {
      value.value.type = 'local'
      value.value.path = path
    }
  } else if (key === 'ftp') {
    const conf = await ftpConfigModalRef.value?.select()
    console.log(conf)
  }
}
</script>

<template>
  <n-input-group>
    <n-input v-model:value="value.path" readonly :placeholder="placeholder">
      <template #prefix>
        <n-tag size="small" :type="value.type ? 'success' : ''">
          {{ value.type ? $t(`views.backpack.${value.type}`) : $t('common.empty') }}
        </n-tag>
      </template>
    </n-input>
    <n-dropdown trigger="hover" :options="options" @select="handleSelect">
      <n-button>
        <template #icon>
          <n-icon> <FolderOutline /> </n-icon>
        </template>
      </n-button>
    </n-dropdown>
    <FtpConfigModal ref="ftpConfigModalRef"></FtpConfigModal>
  </n-input-group>
</template>

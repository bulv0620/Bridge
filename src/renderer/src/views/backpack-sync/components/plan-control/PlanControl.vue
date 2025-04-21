<script setup lang="ts">
import { FileTrayFull, Document, Save } from '@vicons/ionicons5'
import { FolderInfo } from '../folder-selection-input/FolderSelectionInput.vue'

withDefaults(
  defineProps<{
    processing: boolean
  }>(),
  {
    processing: false,
  },
)

const planName = defineModel<string>('planName', { required: true })
const sourceFolder = defineModel<FolderInfo>('sourceFolder', { required: true })
const targetFolder = defineModel<FolderInfo>('targetFolder', { required: true })
const folderWhiteList = defineModel<string[]>('folderWhiteList', { required: true })
</script>

<template>
  <n-flex>
    <n-popover trigger="hover" placement="bottom" :delay="500" :disabled="processing">
      <template #trigger>
        <n-button circle :disabled="processing">
          <template #icon>
            <n-icon> <Document /> </n-icon>
          </template>
        </n-button>
      </template>
      <span>{{ $t('views.backpack.newPlan') }}</span>
    </n-popover>

    <n-popover trigger="hover" placement="bottom" :delay="500" :disabled="processing">
      <template #trigger>
        <n-button circle :disabled="processing">
          <template #icon>
            <n-icon> <Save /> </n-icon>
          </template>
        </n-button>
      </template>
      <span>{{ $t('views.backpack.savePlan') }}</span>
    </n-popover>

    <n-popover trigger="hover" placement="bottom" :delay="500" :disabled="processing">
      <template #trigger>
        <n-button circle :disabled="processing">
          <template #icon>
            <n-icon> <FileTrayFull /> </n-icon>
          </template>
        </n-button>
      </template>
      <span>{{ $t('views.backpack.savedPlans') }}</span>
    </n-popover>
  </n-flex>
</template>

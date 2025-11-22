<script setup lang="ts">
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { ArrowBackCircle, ArrowForwardCircle } from '@vicons/ionicons5'
import { nextTick } from 'vue'
const props = defineProps<{
  id: string
  isDirectory: boolean
  source: FileInfo | null
  destination: FileInfo | null
}>()

const type = defineModel<FileSyncResolition>('type', { required: true })

const { activeSessionState, activeSessionId } = useActiveSyncSession()

async function handleActionClick(resolution: FileSyncResolition) {
  if (type.value === resolution) {
    type.value = 'ignore'
  } else {
    type.value = resolution
  }

  await nextTick()

  const compareResult = await window.ipc.sync.setResolution(
    activeSessionId.value,
    props.id,
    type.value,
  )
  activeSessionState.value.status.totalCount = compareResult.totalCount
  activeSessionState.value.status.totalBytes = compareResult.totalBytes
}
</script>

<template>
  <div v-if="isDirectory" style="width: 100%; text-align: center">{{ '-' }}</div>
  <div v-else class="resolution-content">
    <el-icon
      :size="20"
      class="icon-button"
      :class="{ active: type === 'toLeft' }"
      @click="handleActionClick('toLeft')"
    >
      <ArrowBackCircle />
    </el-icon>
    <el-icon
      :size="20"
      class="icon-button"
      :class="{ active: type === 'toRight' }"
      @click="handleActionClick('toRight')"
    >
      <ArrowForwardCircle />
    </el-icon>
  </div>
</template>

<style lang="less" scoped>
.resolution-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.icon-button {
  cursor: pointer;
  color: var(--el-fill-color-darker);

  &.active {
    color: var(--el-color-success);
  }
}
</style>

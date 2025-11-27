<script setup lang="ts">
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { ArrowBackCircle, ArrowForwardCircle, ChevronBack, ChevronForward } from '@vicons/ionicons5'
import { nextTick } from 'vue'
const props = defineProps<{
  id: string
  isDirectory: boolean
  source: FileInfo | null
  destination: FileInfo | null
  toLeftCount?: number
  toRightCount?: number
}>()

const emits = defineEmits(['change'])

const type = defineModel<FileSyncResolition>('type', { required: true })

const { activeSession } = useActiveSyncSession()

async function handleActionClick(resolution: FileSyncResolition) {
  const temp = type.value

  if (type.value === resolution) {
    type.value = 'ignore'
  } else {
    type.value = resolution
  }

  await nextTick()

  await activeSession.value.handleChangeResolution(props.id, type.value)

  emits('change', props.id, type.value, temp)
}
</script>

<template>
  <div v-if="isDirectory" class="directory-detail" style="width: 100%; text-align: center">
    <el-text class="text left" type="success">
      {{ toLeftCount }}
      <el-icon><ChevronBack></ChevronBack></el-icon>
    </el-text>
    <el-text class="text right" type="primary">
      <el-icon><ChevronForward></ChevronForward></el-icon>
      {{ toRightCount }}
    </el-text>
  </div>
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
.directory-detail {
  display: flex;
  justify-content: center;
  align-items: center;

  .text {
    font-size: 12px;
    flex: 1;

    &.left {
      text-align: right;
    }

    &.right {
      text-align: left;
    }
  }
}

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

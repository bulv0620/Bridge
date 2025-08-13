<script setup lang="ts">
import { ref } from 'vue'
import { CloseOutline, Play, Pause, Stop } from '@vicons/ionicons5'

interface TransferTaskInfo {
  id: string
  name: string
  percentage: number
  downloadPath: string
}

const showTransferPopover = ref(false)

const transferTaskList = ref<TransferTaskInfo[]>([
  {
    id: '1',
    name: '用UDP实现局域网在线设备发现功能.md',
    percentage: 40,
    downloadPath: '/test',
  },
  {
    id: '2',
    name: 'student_scores_large_v2.xlsx',
    percentage: 20,
    downloadPath: '/test',
  },
  {
    id: '3',
    name: 'student_scores_large_v2.xlsx',
    percentage: 20,
    downloadPath: '/test',
  },
])
</script>

<template>
  <n-popover
    to="#share-hub-drawer-target"
    trigger="manual"
    :show="showTransferPopover"
    placement="top-end"
    :show-arrow="false"
    style="width: 300px"
  >
    <template #trigger>
      <n-button size="tiny" secondary strong @click="showTransferPopover = !showTransferPopover">
        {{ $t('views.shareHub.transferTasks') }}: {{ transferTaskList.length }}
      </n-button>
    </template>

    <template #header>
      <n-space justify="space-between" align="center">
        <n-text :depth="2">{{ $t('views.shareHub.transferTaskList') }}</n-text>
        <n-button size="tiny" secondary strong @click="showTransferPopover = false">
          <template #icon>
            <n-icon><CloseOutline></CloseOutline></n-icon>
          </template>
        </n-button>
      </n-space>
    </template>
    <n-scrollbar style="height: 200px">
      <n-list v-if="transferTaskList.length > 0" hoverable>
        <n-list-item v-for="task in transferTaskList" :key="task.id">
          <n-thing>
            <template #header>
              <n-ellipsis
                :tooltip="{ delay: 500, placement: 'top-end' }"
                style="width: 220px; font-size: 14px"
              >
                {{ task.name }}
              </n-ellipsis>
            </template>
            <template #description>
              <n-progress type="line" :percentage="task.percentage" style="margin-top: 12px" />
            </template>
            <template #footer>
              <n-space>
                <n-button size="tiny" secondary circle type="primary">
                  <template #icon>
                    <n-icon><Play></Play></n-icon>
                  </template>
                </n-button>
                <n-button size="tiny" secondary circle type="warning">
                  <template #icon>
                    <n-icon><Pause></Pause></n-icon>
                  </template>
                </n-button>
                <n-button size="tiny" secondary circle type="error">
                  <template #icon>
                    <n-icon><Stop></Stop></n-icon>
                  </template>
                </n-button>
              </n-space>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
      <n-empty v-else class="empty" description=" "></n-empty>
    </n-scrollbar>
  </n-popover>
</template>

<style scoped lang="less">
.empty {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>

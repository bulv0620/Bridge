<script setup lang="ts">
import { TrashBinOutline } from '@vicons/ionicons5'
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { useSharing } from '@renderer/composables/share-hub/useSharing'
import { ref } from 'vue'
import { getFileIcon } from '@renderer/utils/get-file-icon'
import { DownloadRound } from '@vicons/material'
import { ElMessageBox } from 'element-plus'

const props = defineProps<{
  fileItem: SharedFileInfo
  mine?: boolean
  device?: OnlineDevice
}>()
const emits = defineEmits(['download'])

const { t } = useI18n()
const { mySharedFiles } = useSharing()

const loading = ref(false)

const iconInfo = computed(() => {
  const file = props.fileItem
  return getFileIcon(file.fileName, file.type, (file as any).isDirectory)
})

const expireInfo = computed(() => {
  return dayjs(props.fileItem.status.expiresAt).format('HH:mm:ss')
})

async function handleUnshare() {
  try {
    loading.value = true
    await ElMessageBox({
      type: 'warning',
      title: t('common.warning'),
      message: t('views.shareHub.unshareConfirm'),
      showCancelButton: true,
    })
    mySharedFiles.value = mySharedFiles.value.filter((file) => file.id !== props.fileItem.id)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function handleDownload() {
  emits('download')
}
</script>

<template>
  <div class="file-item" :style="{}">
    <div class="icon-wrap">
      <el-icon class="icon" :size="24" :color="iconInfo.color">
        <component :is="iconInfo.icon"></component>
      </el-icon>
    </div>
    <div class="file-meta">
      <el-text style="width: 100%; margin-bottom: 4px" truncated>{{ fileItem.fileName }}</el-text>
      <el-text style="width: 100%; margin-bottom: 8px" truncated size="small" type="info">
        {{ $t('views.shareHub.expirationTime') }}: {{ expireInfo }}
      </el-text>

      <div class="remaining-box">
        <div
          v-for="item in fileItem.status.total"
          :key="item"
          class="remaining-item"
          :class="{ active: fileItem.status.remaining >= item }"
        ></div>
      </div>
    </div>
    <div class="operation">
      <el-button
        v-if="mine"
        circle
        :icon="TrashBinOutline"
        :loading="loading"
        text
        bg
        @click="handleUnshare"
      ></el-button>

      <el-button
        v-else
        circle
        :icon="DownloadRound"
        :loading="loading"
        text
        bg
        @click="handleDownload"
      ></el-button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.file-item {
  margin-bottom: 10px;
  padding: 10px 14px;
  border-radius: var(--el-border-radius-base);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.25s ease;
  border: 1px solid var(--el-border-color-lighter);
  line-height: normal;

  .file-meta {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .remaining-box {
      width: 100%;
      height: 8px;
      display: flex;
      gap: 2px;
      border-radius: var(--el-border-radius-base);
      overflow: hidden;

      .remaining-item {
        flex: 1;
        background: var(--el-fill-color);

        &.active {
          background: var(--el-color-primary-light-5);
        }
      }
    }
  }

  .operation {
    margin-left: auto;
  }
}
</style>

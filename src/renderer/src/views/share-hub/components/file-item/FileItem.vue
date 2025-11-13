<script setup lang="ts">
import { TrashBinOutline } from '@vicons/ionicons5'
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { useSharing } from '@renderer/composables/share-hub/useSharing'
import { useDiscreteApi } from '@renderer/composables/discrete-api/useDiscreteApi'
import { ref } from 'vue'
import { getFileIcon } from '@renderer/utils/get-file-icon'
import { useThemeVars } from 'naive-ui'
import { DownloadRound } from '@vicons/material'

const props = defineProps<{
  fileItem: SharedFileInfo
  mine?: boolean
  device?: OnlineDevice
}>()
const emits = defineEmits(['download'])

const themeVars = useThemeVars()
const primaryColor = computed(() => themeVars.value.primaryColor)
const { confirm } = useDiscreteApi()
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
    await confirm('warning', {
      title: t('common.warning'),
      content: t('views.shareHub.unshareConfirm'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
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
      <n-icon class="icon" :size="24" :component="iconInfo.icon" :color="iconInfo.color" />
    </div>
    <div class="file-meta">
      <n-ellipsis style="width: 100%">{{ fileItem.fileName }}</n-ellipsis>
      <n-ellipsis style="width: 100%; font-size: 12px; margin-bottom: 8px">
        <n-text :depth="3" class="expire"
          >{{ $t('views.shareHub.expirationTime') }}: {{ expireInfo }}</n-text
        >
      </n-ellipsis>
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
      <CommonButton
        v-if="mine"
        tooltip="取消共享"
        :icon="TrashBinOutline"
        :button-props="{ size: 'small', circle: true, secondary: true }"
        placement="bottom"
        :delay="500"
        :loading="loading"
        @click="handleUnshare"
      />
      <CommonButton
        v-if="!mine"
        tooltip="下载"
        :icon="DownloadRound"
        :button-props="{ size: 'small', circle: true, secondary: true }"
        placement="bottom"
        :delay="500"
        :loading="loading"
        @click="handleDownload"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.file-item {
  margin-bottom: 10px;
  padding: 10px 14px;
  border-radius: var(--n-border-radius);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.25s ease;
  border: 1px solid var(--n-border-color);

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
      border-radius: var(--n-border-radius);
      overflow: hidden;

      .remaining-item {
        flex: 1;
        background: var(--n-border-color);

        &.active {
          background: v-bind(primaryColor);
        }
      }
    }
  }

  .operation {
    margin-left: auto;
  }
}
</style>

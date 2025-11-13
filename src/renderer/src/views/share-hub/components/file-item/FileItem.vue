<script setup lang="ts">
import { TrashBinOutline } from '@vicons/ionicons5'
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useTheme } from '@renderer/composables/setting/useTheme'
import { useI18n } from 'vue-i18n'
import { useSharing } from '@renderer/composables/share-hub/useSharing'
import { useDiscreteApi } from '@renderer/composables/discrete-api/useDiscreteApi'
import { ref } from 'vue'
import { getFileIcon } from '@renderer/utils/get-file-icon'

const props = defineProps<{
  fileItem: SharedFileInfo
  mine?: boolean
  device?: OnlineDevice
}>()

const { currentTheme } = useTheme()
const { confirm } = useDiscreteApi()
const { t } = useI18n()
const { mySharedFiles } = useSharing()

const loading = ref(false)

const iconInfo = computed(() => {
  const file = props.fileItem
  return getFileIcon(file.fileName, file.type, (file as any).isDirectory)
})

const remainingInfo = computed(() => {
  const { remaining, total } = props.fileItem.status
  return `${remaining} / ${total}`
})

const expireInfo = computed(() => {
  return dayjs(props.fileItem.status.expiresAt).format('YYYY-MM-DD HH:mm')
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
</script>

<template>
  <div class="file-item" :class="currentTheme">
    <div class="icon-wrap">
      <n-icon class="icon" :size="24" :component="iconInfo.icon" :color="iconInfo.color" />
    </div>
    <div class="file-meta">
      <div class="file-item__name">
        <n-ellipsis style="width: 100%">{{ fileItem.fileName }}</n-ellipsis>
      </div>
      <div class="file-item__extra">
        <n-ellipsis style="width: 100%">
          <span class="quota">{{ remainingInfo }}</span>
          <span class="expire">{{ $t('views.shareHub.expirationTime') }}: {{ expireInfo }}</span>
        </n-ellipsis>
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
    </div>
  </div>
</template>

<style lang="less" scoped>
.file-item {
  margin-bottom: 10px;
  padding: 10px 14px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.25s ease;

  // 🌞 light 模式
  &.light {
    background: rgb(250, 250, 252);
    border: 1px solid rgb(239, 239, 245);

    .file-item__name {
      color: #333;
    }
    .file-item__extra {
      color: #666;

      .quota {
        color: #26a69a;
      }
      .expire {
        color: #ef5350;
      }
    }
  }

  // 🌙 dark 模式
  &.dark {
    background: rgba(255, 255, 255, 0.06);
    border: none;

    .file-item__name {
      color: #f0f0f0;
    }
    .file-item__extra {
      color: #aaa;

      .quota {
        color: #4dd0e1; // 青色，夜间更柔和
      }
      .expire {
        color: #ef9a9a; // 浅红，不刺眼
      }
    }
  }

  .file-meta {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .file-item__name {
    width: 100%;
    font-size: 14px;
    font-weight: 500;
  }

  .file-item__extra {
    width: 100%;
    margin-top: 2px;
    font-size: 12px;
    display: flex;
    gap: 12px;

    .quota {
      font-weight: 500;
      margin-right: 6px;
    }
  }

  .operation {
    margin-left: auto;
  }
}
</style>

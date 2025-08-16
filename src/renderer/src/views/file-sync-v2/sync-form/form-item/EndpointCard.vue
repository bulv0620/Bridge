<script setup lang="ts">
import { computed } from 'vue'
// import Drive from '@renderer/assets/imgs/drive.png'
// import CloudDrive from '@renderer/assets/imgs/cloud_drive.png'
import Search from '@renderer/assets/imgs/search.png'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  type: 'source' | 'destination'
}>()

const { t } = useI18n()

const title = computed(() => {
  if (props.type === 'source') {
    return t('views.fileSyncV2.syncSource')
  } else {
    return t('views.fileSyncV2.syncDestination')
  }
})

const endPointImage = computed(() => {
  return Search
})
</script>

<template>
  <n-card size="small" style="flex: 1; overflow: hidden">
    <div class="card-content">
      <img class="endpoint-image" :src="endPointImage" draggable="false" />
      <div class="text">
        <n-ellipsis style="width: 100%">
          <n-text :depth="3">{{ title }}</n-text>
        </n-ellipsis>
        <n-ellipsis style="width: 100%">
          <n-a>{{ $t('views.fileSyncV2.notSelected') }}</n-a>
        </n-ellipsis>
      </div>
    </div>
  </n-card>
</template>

<style lang="less" scoped>
.card-content {
  display: flex;
  gap: 12px;
  align-items: center;

  .endpoint-image {
    width: 32px;
    user-select: none;
  }

  .text {
    flex: 1;
    overflow: hidden;
  }
}
</style>

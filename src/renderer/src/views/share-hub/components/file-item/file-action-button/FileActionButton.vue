<script setup lang="ts">
import { useDiscreteApi } from '@renderer/composables/discrete-api/useDiscreteApi'
import { useSharing } from '@renderer/composables/share-hub/useSharing'
import { TrashBinOutline } from '@vicons/ionicons5'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  fileItem: SharedFileInfo
}>()

const { confirm } = useDiscreteApi()
const { t } = useI18n()

const loading = ref(false)

const { mySharedFiles } = useSharing()

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
  <CommonButton
    tooltip="取消共享"
    :icon="TrashBinOutline"
    :button-props="{ size: 'small', circle: true, secondary: true }"
    placement="bottom"
    :delay="500"
    :loading="loading"
    @click="handleUnshare"
  />
</template>

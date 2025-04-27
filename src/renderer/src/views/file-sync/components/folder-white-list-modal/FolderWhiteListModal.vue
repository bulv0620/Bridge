<template>
  <n-modal
    v-model:show="visible"
    style="width: 400px"
    preset="card"
    :title="$t('views.fileSync.folderWhiteList')"
    :on-after-leave="handleNegativeClick"
  >
    <n-alert
      v-if="showAlert"
      type="info"
      style="margin-bottom: 12px"
      closable
      @close="handleAlertClose"
    >
      {{ $t('views.fileSync.needRecompare') }}
    </n-alert>

    <n-scrollbar style="max-height: 220px">
      <n-dynamic-input v-model:value="whiteList" />
    </n-scrollbar>
    <template #footer>
      <n-flex justify="end">
        <n-button size="small" @click="visible = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" size="small" @click="handlePositiveClick">
          {{ t('common.confirm') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()

const visible = ref(false)

const whiteList = ref<string[]>([])
const resolveRef = ref<((value: any) => void) | null>(null)

const showAlert = ref<boolean>(true)
watch(visible, (val) => {
  if (val && localStorage.getItem('hideWhiteListInfo')) {
    showAlert.value = false
  }
})
const handleAlertClose = () => {
  localStorage.setItem('hideWhiteListInfo', '1')
}

const select = (initWhiteList: string[]) => {
  return new Promise<any>((resolve) => {
    whiteList.value = initWhiteList.map((el) => el)
    visible.value = true
    resolveRef.value = resolve
  })
}

const handlePositiveClick = () => {
  if (whiteList.value.some((item) => item.trim() === '')) {
    message.error(t('views.fileSync.folderWhiteListEmptyValue'))
    return
  }

  if (resolveRef.value) {
    resolveRef.value(whiteList.value)
    resolveRef.value = null
  }
  visible.value = false
}

const handleNegativeClick = () => {
  if (resolveRef.value) {
    resolveRef.value(null)
    resolveRef.value = null
  }
  visible.value = false
}

defineExpose({
  select,
})
</script>

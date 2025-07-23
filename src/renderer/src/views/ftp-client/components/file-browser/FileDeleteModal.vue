<script setup lang="ts">
import { useFtp } from '@renderer/composables/ftp'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import { useMessage } from 'naive-ui'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()
const { currentInstance } = useFtp()

const loading = ref(false)
const visible = ref(false)

const delFiles = ref<FileInfo[]>([])
const currentDelIndex = ref(0)

const errorFlag = ref(false)
const stopFlag = ref(false)

const conflictHandleType = ref<'' | 'ignore' | 'cover'>('')

const percentage = computed(() => {
  if (delFiles.value.length === 0) return 0
  return Math.round((currentDelIndex.value / delFiles.value.length) * 100)
})
const currentDownloadFile = computed(() => {
  return delFiles.value[currentDelIndex.value] || null
})
const complete = computed(() => {
  return currentDelIndex.value === delFiles.value.length
})

function open(files: FileInfo[]) {
  delFiles.value = files

  loading.value = false
  visible.value = true

  errorFlag.value = false
  stopFlag.value = false
  conflictHandleType.value = ''

  doDel()
}

async function doDel() {
  for (const file of delFiles.value) {
    if (stopFlag.value) break

    try {
      if (file.isDirectory) {
        await currentInstance.value?.delFolder(file.filePath)
      } else {
        await currentInstance.value?.delFile(file.filePath)
      }

      currentDelIndex.value++

      await nextTick()
    } catch (error: any) {
      console.error(error)
      message.error(error.message)
      errorFlag.value = true
      break
    }
  }
  if (errorFlag.value) {
    message.error(t('views.ftpClient.deleteFailed'))
  } else if (stopFlag.value) {
    message.info(t('views.ftpClient.deleteCancel'))
  } else {
    message.success(t('views.ftpClient.deleteComplete'))
  }
  currentInstance.value?.disconnect()
}

function handleCancel() {
  stopFlag.value = true
}

defineExpose({
  open,
})
</script>

<template>
  <n-modal
    v-model:show="visible"
    :style="`width: 500px; max-width: 100%`"
    preset="card"
    :title="$t('views.ftpClient.delete')"
    :on-after-leave="handleCancel"
    :mask-closable="false"
    :esc-key-closable="false"
  >
    <n-progress
      :processing="loading"
      :status="errorFlag ? 'error' : complete ? 'success' : 'info'"
      type="line"
      :percentage="percentage"
    >
      <n-text :type="errorFlag ? 'error' : ''">
        {{ currentDelIndex }} / {{ delFiles.length }}
      </n-text>
    </n-progress>
    <n-text :type="errorFlag ? 'error' : ''">{{ currentDownloadFile?.fileName }}</n-text>
    <n-text v-if="complete" type="success">{{ $t('common.complete') }}</n-text>

    <template #footer>
      <n-flex>
        <n-button size="small" @click="visible = false">
          {{ t('common.close') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

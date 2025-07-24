<script setup lang="ts">
import { useFtp } from '@renderer/composables/ftp'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import { useMessage } from 'naive-ui'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmOverwriteDialog from './ConfirmOverwriteDialog.vue'

const stream = window.api.stream

const emits = defineEmits(['refresh'])

const { t } = useI18n()
const message = useMessage()
const { currentInstance, currentInstancePath } = useFtp()

const confirmOverwriteDialogRef = ref<InstanceType<typeof ConfirmOverwriteDialog> | null>(null)

const loading = ref(false)
const visible = ref(false)

const uploadFiles = ref<FileList>([] as any)
const browserFileList = ref<FileInfo[]>([])

const currentUploadIndex = ref(0)
const errorFlag = ref(false)
const stopFlag = ref(false)

const conflictHandleType = ref<'' | 'ignore' | 'cover'>('')

const percentage = computed(() => {
  if (uploadFiles.value.length === 0) return 0
  return Math.round((currentUploadIndex.value / uploadFiles.value.length) * 100)
})
const currentDownloadFile = computed(() => {
  return uploadFiles.value[currentUploadIndex.value] || null
})
const complete = computed(() => {
  return currentUploadIndex.value === uploadFiles.value.length
})

async function open(files: FileList, fileList: FileInfo[]) {
  uploadFiles.value = files
  browserFileList.value = fileList

  currentUploadIndex.value = 0

  loading.value = false
  visible.value = true

  errorFlag.value = false
  stopFlag.value = false
  conflictHandleType.value = ''

  await nextTick()
  upload()
}

async function upload() {
  for (const file of uploadFiles.value) {
    if (stopFlag.value) break
    const remotePath = `${currentInstancePath.value.join('/')}/${file.name}`
    try {
      const exist = browserFileList.value.find((f) => f.fileName === file.name && !f.isDirectory)
      if (exist) {
        if (!conflictHandleType.value) {
          // 无记录的操作选项
          const [confirmFlag, rememberFlag] = await confirmOverwriteDialogRef.value!.open(file.name)

          // 记住选择
          if (rememberFlag) {
            conflictHandleType.value = confirmFlag ? 'cover' : 'ignore'
          }

          if (confirmFlag) {
            await currentInstance.value!.delFile(remotePath)
          } else {
            currentUploadIndex.value++
            continue
          }
        } else if (conflictHandleType.value === 'ignore') {
          currentUploadIndex.value++
          continue
        } else if (conflictHandleType.value === 'cover') {
          await currentInstance.value!.delFile(remotePath)
        }
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const fileStrem = stream.Readable.from(buffer)
      await currentInstance.value!.writeFileStream(remotePath, fileStrem)

      currentUploadIndex.value++

      await nextTick()
    } catch (error: any) {
      console.error(error)
      message.error(error.message)
      errorFlag.value = true
      break
    }
  }
  if (errorFlag.value) {
    message.error(t('views.ftpClient.uploadFailed'))
  } else if (stopFlag.value) {
    message.info(t('views.ftpClient.uploadCancel'))
  } else {
    message.success(t('views.ftpClient.uploadComplete'))
  }
  currentInstance.value?.disconnect()
  emits('refresh')
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
    :title="$t('views.ftpClient.upload')"
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
        {{ currentUploadIndex }} / {{ uploadFiles.length }}
      </n-text>
    </n-progress>
    <n-text :type="errorFlag ? 'error' : ''">{{ currentDownloadFile?.name }}</n-text>
    <n-text v-if="complete" type="success">{{ $t('common.complete') }}</n-text>

    <template #footer>
      <n-flex>
        <n-button size="small" @click="visible = false">
          {{ t('common.close') }}
        </n-button>
      </n-flex>
    </template>
    <ConfirmOverwriteDialog ref="confirmOverwriteDialogRef"></ConfirmOverwriteDialog>
  </n-modal>
</template>

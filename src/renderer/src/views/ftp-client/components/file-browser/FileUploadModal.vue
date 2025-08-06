<script setup lang="ts">
import { useFtpClient } from '@renderer/composables/ftp-client/useFtpClient'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import { useMessage } from 'naive-ui'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmOverwriteDialog from './ConfirmOverwriteDialog.vue'
import { LocalFileSystem } from '@renderer/utils/file-system'

const fs = window.api.fsSync
const path = window.api.path

const emits = defineEmits(['refresh'])

const { t } = useI18n()
const message = useMessage()
const { currentInstance, currentInstancePath } = useFtpClient()

const confirmOverwriteDialogRef = ref<InstanceType<typeof ConfirmOverwriteDialog> | null>(null)

const loading = ref(false)
const visible = ref(false)

const fileList = ref<FileInfo[]>([])

const currentUploadIndex = ref(0)
const errorFlag = ref(false)
const stopFlag = ref(false)

const conflictHandleType = ref<'' | 'ignore' | 'cover'>('')

const percentage = computed(() => {
  if (fileList.value.length === 0) return 0
  return Math.round((currentUploadIndex.value / fileList.value.length) * 100)
})
const currentDownloadFile = computed(() => {
  return fileList.value[currentUploadIndex.value] || null
})
const complete = computed(() => {
  return currentUploadIndex.value === fileList.value.length
})

async function open(pathList: string[]) {
  fileList.value = []

  for (const filePath of pathList) {
    const stats = fs.statSync(filePath)
    const dirname = path.dirname(filePath)
    const basename = path.basename(filePath)

    if (stats.isDirectory()) {
      const localFileSystem = new LocalFileSystem(dirname)

      const files = await localFileSystem.getAllFiles(basename)

      fileList.value.push(...files)
    } else {
      fileList.value.push({
        fileName: basename,
        size: stats.size,
        timestamp: stats.mtime,
        filePath: filePath,
        relativePath: basename,
        meta: {
          atime: stats.atime,
          mtime: stats.mtime,
          mode: stats.mode,
          size: stats.size,
        },
        isDirectory: false,
      })
    }
  }

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
  for (const file of fileList.value) {
    if (stopFlag.value) break
    try {
      const remotePath = currentInstancePath.value.join('/')
      const relativePath = path.join(remotePath, file.relativePath)

      const exist = await currentInstance.value!.exists(relativePath)
      if (exist) {
        if (!conflictHandleType.value) {
          // 无记录的操作选项
          const [confirmFlag, rememberFlag] = await confirmOverwriteDialogRef.value!.open(
            file.fileName,
          )

          // 记住选择
          if (rememberFlag) {
            conflictHandleType.value = confirmFlag ? 'cover' : 'ignore'
          }

          if (confirmFlag) {
            await currentInstance.value!.delFile(relativePath)
          } else {
            currentUploadIndex.value++
            continue
          }
        } else if (conflictHandleType.value === 'ignore') {
          currentUploadIndex.value++
          continue
        } else if (conflictHandleType.value === 'cover') {
          await currentInstance.value!.delFile(relativePath)
        }
      }

      const stream = fs.createReadStream(file.filePath)
      await currentInstance.value!.writeFileStream(relativePath, stream)

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
        {{ currentUploadIndex }} / {{ fileList.length }}
      </n-text>
    </n-progress>
    <n-text v-if="complete" type="success">{{ $t('common.complete') }}</n-text>
    <n-ellipsis v-else :type="errorFlag ? 'error' : ''" style="width: 100%">
      {{ currentDownloadFile?.fileName }}
    </n-ellipsis>

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

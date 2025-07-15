<script setup lang="ts">
import { useFtp } from '@renderer/composables/ftp'
import { LocalFileSystem } from '@renderer/utils/file-system'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import { useMessage } from 'naive-ui'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const path = window.api.path

const { t } = useI18n()
const message = useMessage()
const { currentInstance } = useFtp()

const loading = ref(false)
const visible = ref(false)

const downloadFiles = ref<FileInfo[]>([])
const downloadPath = ref('')
const currentFtpPath = ref('/')
const currentDownloadIndex = ref(0)
const errorFlag = ref(false)
const stopFlag = ref(false)
const coverFlag = ref(false)

const percentage = computed(() => {
  if (downloadFiles.value.length === 0) return 0
  return Math.round((currentDownloadIndex.value / downloadFiles.value.length) * 100)
})
const currentDownloadFile = computed(() => {
  return downloadFiles.value[currentDownloadIndex.value] || null
})

function open(files: FileInfo[], path: string, ftpPath: string) {
  downloadFiles.value = files
  downloadPath.value = path
  currentFtpPath.value = ftpPath || '/'
  currentDownloadIndex.value = 0

  loading.value = false
  visible.value = true

  errorFlag.value = false
  stopFlag.value = false
  coverFlag.value = false

  download()
}

async function download() {
  const localFileSystem = new LocalFileSystem(downloadPath.value)

  for (const file of downloadFiles.value) {
    if (stopFlag.value) break

    try {
      const downloadToPath = path.posix.relative(currentFtpPath.value, file.filePath)

      const exist = await localFileSystem.exists(downloadToPath)
      if (exist && !coverFlag.value) {
        // 文件已存在是否覆盖
        await localFileSystem.delFile(downloadToPath)
      }

      const stream = await currentInstance.value!.getFileStream(file.relativePath)
      const meta = file.meta

      await localFileSystem.writeFileStream(downloadToPath, stream)
      await localFileSystem.setMeta(downloadToPath, meta)
      currentDownloadIndex.value++

      await nextTick()
    } catch (error: any) {
      console.error(error)
      message.error(error.message)
      errorFlag.value = true
      break
    }
  }
  if (errorFlag.value) {
    message.error(t('views.ftpClient.downloadFailed'))
  } else if (stopFlag.value) {
    message.info(t('views.ftpClient.downloadCancel'))
  } else {
    message.success(t('views.ftpClient.downloadComplete'))
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
    :style="`width: 400px; max-width: 100%`"
    preset="card"
    :title="$t('views.ftpClient.download')"
    :on-after-leave="handleCancel"
    :mask-closable="false"
    :esc-key-closable="false"
  >
    <n-text :type="errorFlag ? 'error' : ''">{{ currentDownloadFile?.fileName }}</n-text>
    <n-progress
      :processing="loading"
      :status="errorFlag ? 'error' : 'success'"
      type="line"
      :percentage="percentage"
    >
      <n-text :type="errorFlag ? 'error' : ''">
        {{ currentDownloadIndex }} / {{ downloadFiles.length }}
      </n-text>
    </n-progress>

    <template #footer>
      <n-flex>
        <n-button size="small" @click="visible = false">
          {{ t('common.close') }}
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

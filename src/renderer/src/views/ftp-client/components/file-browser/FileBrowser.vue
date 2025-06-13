<script setup lang="ts">
import { nextTick, ref, watch, h, computed } from 'vue'
import { FolderOpen, Refresh } from '@vicons/ionicons5'
import { useFtp } from '@renderer/composables/ftp'
import dayjs from 'dayjs'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import FileNameWithIcon from './FileNameWithIcon.vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { currentInstance, currentInstancePath } = useFtp()
const message = useMessage()
const { t } = useI18n()

const loading = ref(false)

const data = ref<FileInfo[]>([])
const columns = computed(() => [
  {
    type: 'selection',
  },
  {
    title: t('views.ftpClient.fileName'),
    key: 'fileName',
    ellipsis: { tooltip: true },
    sorter: (a: FileInfo, b: FileInfo) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return a.fileName.localeCompare(b.fileName)
    },
    render(row: FileInfo) {
      return h(FileNameWithIcon, {
        fileName: row.fileName,
        isDirectory: row.isDirectory,
      })
    },
  },
  {
    title: t('views.ftpClient.fileDate'),
    key: 'timestamp',
    ellipsis: { tooltip: true },
    sorter: (a: FileInfo, b: FileInfo) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    },
    render(row: FileInfo) {
      return dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss')
    },
  },
  {
    title: t('views.ftpClient.fileSize'),
    key: 'size',
    ellipsis: { tooltip: true },
    sorter: (a: FileInfo, b: FileInfo) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return a.size - b.size
    },
    render(row: FileInfo) {
      return row.isDirectory ? '_' : formatFileSize(row.size)
    },
  },
])

const formatFileSize = (size: number): string => {
  if (isNaN(size) || size < 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }

  return `${size.toFixed(2)} ${units[index]}`
}

const getFiles = async () => {
  try {
    loading.value = true

    data.value = []

    const valid = await currentInstance.value?.validate()
    if (!valid) {
      message.error(t('views.ftpClient.invalidInstance'))
      return
    }

    const result = await currentInstance.value?.listDir(currentInstancePath.value?.join('/'))

    if (result) {
      data.value = result.map((el) => ({
        ...el,
        key: crypto.randomUUID(),
      }))
    }

    currentInstance.value?.disconnect()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleRowProps = (row: FileInfo) => {
  return {
    ondblclick: () => handleRowDblClick(row),
  }
}

const handleRowDblClick = (row: FileInfo) => {
  if (row.isDirectory) {
    currentInstancePath.value?.push(row.fileName)
  }
}

watch(
  currentInstancePath,
  () => {
    nextTick(() => {
      getFiles()
    })
  },
  {
    immediate: true,
    deep: true,
  },
)
</script>

<template>
  <div class="file-browser">
    <n-space justify="space-between">
      <n-breadcrumb>
        <n-breadcrumb-item
          v-for="(path, index) in currentInstancePath"
          :key="path"
          @click="currentInstancePath.splice(index + 1)"
        >
          <n-icon :component="FolderOpen" color="#f9a825" /> {{ path || '(ROOT)' }}
        </n-breadcrumb-item>
      </n-breadcrumb>

      <n-button size="small" circle @click="getFiles">
        <template #icon>
          <n-icon><Refresh /></n-icon>
        </template>
      </n-button>
    </n-space>
    <n-data-table
      :loading="loading"
      size="small"
      :columns="columns"
      :data="data"
      virtual-scroll
      flex-height
      :row-props="handleRowProps"
      style="height: 100%; user-select: none"
    />
  </div>
</template>

<style lang="less" scoped>
.file-browser {
  height: calc(100% - 24px);
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>

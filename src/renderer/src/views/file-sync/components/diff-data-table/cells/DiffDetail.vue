<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { DiffFile } from '@renderer/composables/file-sync/useSyncTool'

const props = defineProps<{
  diffFile: DiffFile
}>()

const { t } = useI18n()

// 定义数据表的列配置
const columns = computed(() => [
  {
    title: '',
    key: 'prop',
    align: 'left',
    width: 110,
  },
  {
    title: t('views.fileSync.sourceFileInfo'),
    key: 'source',
    align: 'left',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: t('views.fileSync.targetFileInfo'),
    key: 'target',
    align: 'left',
    ellipsis: {
      tooltip: true,
    },
  },
])

// 将原有表格内容转化为数据数组，每一项对应一行
const tableData = computed(() => [
  {
    prop: t('views.fileSync.fileName'),
    source: props.diffFile.source?.fileName ?? '',
    target: props.diffFile.target?.fileName ?? '',
  },
  {
    prop: t('views.fileSync.filePath'),
    source: props.diffFile.source?.relativePath ?? '',
    target: props.diffFile.target?.relativePath ?? '',
  },
  {
    prop: t('views.fileSync.fileSize'),
    source: props.diffFile.source?.size ?? '',
    target: props.diffFile.target?.size ?? '',
  },
  {
    prop: t('views.fileSync.fileTimestamp'),
    source: props.diffFile.source?.timestamp
      ? dayjs(props.diffFile.source.timestamp).format('YYYY-MM-DD HH:mm:ss')
      : '',
    target: props.diffFile.target?.timestamp
      ? dayjs(props.diffFile.target.timestamp).format('YYYY-MM-DD HH:mm:ss')
      : '',
  },
])
</script>

<template>
  <n-card size="small">
    <n-alert
      v-if="diffFile.error"
      :title="$t('common.error')"
      type="error"
      style="margin-bottom: 12px"
    >
      {{ diffFile.error?.message }}
    </n-alert>
    <n-data-table :single-line="false" :columns="columns" :data="tableData" size="small" bordered />
  </n-card>
</template>

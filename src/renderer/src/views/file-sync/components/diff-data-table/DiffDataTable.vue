<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import DiffTypeTag from './cells/DiffTypeTag.vue'
import DiffActionButton from './cells/DiffActionButton.vue'
import DiffDetail from './cells/DiffDetail.vue'
import { useDiffList } from '@renderer/composables/file-sync/useDiffList'
import { DiffFile } from '@renderer/composables/file-sync/useSyncTool'
import { useFileDiff } from '@renderer/composables/file-sync/useFileDiff'
import { useFileSync } from '@renderer/composables/file-sync/useFileSync'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { SwapHorizontal, FileTrayFull } from '@vicons/ionicons5'
import { usePlanManage } from '@renderer/composables/file-sync/usePlanManage'

const { t } = useI18n()

const { sourceFolder, targetFolder } = useSyncForm()
const { diffTableData, filterOptionValues, tableRef, handleUpdateFilter } = useDiffList()
const { diffLoading, startDiff } = useFileDiff()
const { processing } = useFileSync()
const { openPlanManageModal } = usePlanManage()

const columns = computed(() => [
  {
    type: 'expand',
    expandable: () => !processing.value,
    renderExpand: (row: DiffFile) => {
      return h(DiffDetail, { diffFile: row })
    },
  },
  {
    title: t('views.fileSync.index'),
    key: 'key',
    align: 'center',
    width: 60,
    render(_: DiffFile, index: number) {
      return index + 1
    },
  },
  {
    title: t('views.fileSync.diffType'),
    key: 'diffType',
    align: 'center',
    width: 140,
    filterOptionValues: filterOptionValues.value,
    filterOptions: [
      {
        label: t('views.fileSync.onlySource'),
        value: 'onlySource',
      },
      {
        label: t('views.fileSync.onlyTarget'),
        value: 'onlyTarget',
      },
      {
        label: t('views.fileSync.conflict'),
        value: 'conflict',
      },
    ],
    filter(value: string, row: DiffFile) {
      return row.diffType === value
    },
    render(row: DiffFile) {
      return h(DiffTypeTag, {
        diffType: row.diffType,
      })
    },
  },
  {
    title: t('views.fileSync.sourceFile'),
    key: 'sourceFileName',
    align: 'center',
    resizable: true,
    render(row: DiffFile) {
      return row.source?.fileName
    },
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: t('views.fileSync.targetFile'),
    key: 'targetFileName',
    align: 'center',
    resizable: true,
    render(row: DiffFile) {
      return row.target?.fileName
    },
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: t('views.fileSync.action'),
    key: 'operation',
    align: 'center',
    width: 100,
    render(row: DiffFile) {
      return h(DiffActionButton, {
        status: row.status!,
        processing: processing.value,
        action: row.action,
        'onUpdate:action': (val) => {
          row.action = val
        },
      })
    },
  },
])

const emptyText = computed(() => {
  if (sourceFolder.value.path && targetFolder.value.path) {
    return t('views.fileSync.noDiffFile')
  } else {
    return t('views.fileSync.createOrSelectPlan')
  }
})
</script>

<template>
  <n-data-table
    ref="tableRef"
    size="small"
    virtual-scroll
    :columns="columns"
    :data="diffTableData"
    flex-height
    style="height: 100%"
    @update:filters="handleUpdateFilter"
  >
    <template #empty>
      <n-empty :description="emptyText">
        <template #icon>
          <n-icon>
            <SwapHorizontal v-if="sourceFolder.path && targetFolder.path" />
            <FileTrayFull v-else></FileTrayFull>
          </n-icon>
        </template>
        <template #extra>
          <n-button
            v-if="sourceFolder.path && targetFolder.path"
            size="small"
            :disabled="diffLoading"
            @click="startDiff"
          >
            {{ $t('views.fileSync.contrast') }}
          </n-button>
          <n-button v-else size="small" @click="openPlanManageModal">
            {{ $t('views.fileSync.selectPlan') }}
          </n-button>
        </template>
      </n-empty>
    </template>
  </n-data-table>
</template>

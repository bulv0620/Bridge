<script setup lang="ts">
import FileNameWithIcon from './cells/FileNameWithIcon.vue'
import SyncResolution from './cells/SyncResolution.vue'
import { ElTable, TableColumnCtx } from 'element-plus'
import { changeColor } from 'seemly'
import { formatBytes } from '@renderer/utils/format'
import dayjs from 'dayjs'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { ref } from 'vue'

const { activeSessionId, activeSessionState } = useActiveSyncSession()

const tableRef = ref<InstanceType<typeof ElTable> | null>(null)

function cellStyle({
  row,
  column,
}: {
  row: FileDifference
  column: TableColumnCtx<FileDifference>
  rowIndex: number
  columnIndex: number
}) {
  if (row.isDirectory) return {}

  const successColor = changeColor('#67C23A', { alpha: 0.1 })
  const infoColor = changeColor('#409EFF', { alpha: 0.1 })
  const errorColor = changeColor('#F56C6C', { alpha: 0.1 })

  let type = ''
  if (column.property.includes('left')) {
    type = 'source'
  } else if (column.property.includes('right')) {
    type = 'destination'
  } else {
    return {}
  }

  const filePresent = type === 'source' ? !!row.source : !!row.destination
  const isLeft = row.resolution === 'toLeft'
  const isRight = row.resolution === 'toRight'

  const mkStyle = (bg: string, strike = false) =>
    strike ? { backgroundColor: bg, textDecoration: 'line-through' } : { backgroundColor: bg }

  // 语义化条件
  const presentAndRemoved =
    filePresent && ((type === 'source' && isLeft) || (type === 'destination' && isRight))
  const presentAndAdded =
    filePresent && ((type === 'source' && isRight) || (type === 'destination' && isLeft))
  const absentAndAdded =
    !filePresent && ((type === 'source' && isLeft) || (type === 'destination' && isRight))

  if (presentAndRemoved) return mkStyle(errorColor, true)
  if (presentAndAdded) return mkStyle(infoColor)
  if (absentAndAdded) return mkStyle(successColor)

  return {}
}

function rowClassName({ row }) {
  if (row.resolution === 'ignore') {
    return 'grey-row'
  }

  return ''
}

async function load(row: FileDifference, _: unknown, resolve: (data: FileDifference[]) => void) {
  const result = await window.ipc.sync.getDiffItems(activeSessionId.value, row.id)

  resolve(result)
}

function getFormatDate(type: 'source' | 'destination', differentItem: FileDifference) {
  if (differentItem.isDirectory) {
    return '-'
  }
  const target = type === 'source' ? differentItem.source : differentItem.destination
  if (!target) return ''
  else {
    return dayjs(target.timestamp).format('YYYY-MM-DD HH:mm:ss')
  }
}

function getFileSize(type: 'source' | 'destination', differentItem: FileDifference) {
  if (differentItem.isDirectory) {
    return '-'
  }
  const target = type === 'source' ? differentItem.source : differentItem.destination
  if (!target) return ''
  else {
    return formatBytes(target.size)
  }
}

// 更新表格中上层文件夹的count数量 !危险的hack方式
async function handleResolutionChange(
  id: string,
  newResolution: FileSyncResolition,
  oldResolution: FileSyncResolition,
) {
  const inst = (tableRef.value as any).$
  const treeMap = inst.setupState.store.states.lazyTreeNodeMap
  const rootList = inst.setupState.store.states.data

  let leftNum = 0
  let rightNum = 0

  if (oldResolution === 'toLeft') {
    leftNum--
  } else if (oldResolution === 'toRight') {
    rightNum--
  }

  if (newResolution === 'toLeft') {
    leftNum++
  } else if (newResolution === 'toRight') {
    rightNum++
  }

  let chain = await window.ipc.sync.getAncestorChain(activeSessionId.value, id)

  while (chain.parent) {
    if (chain.grandParent) {
      const list = treeMap.value[chain.grandParent.id]
      const item = list.find((el: FileDifference) => el.id === chain.parent!.id)
      item.toLeftCount += leftNum
      item.toRightCount += rightNum
    } else {
      const item = rootList.value.find((el: FileDifference) => el.id === chain.parent!.id)
      item.toLeftCount += leftNum
      item.toRightCount += rightNum
    }
    chain = await window.ipc.sync.getAncestorChain(activeSessionId.value, chain.parent!.id)
  }
}
</script>

<template>
  <el-table
    ref="tableRef"
    v-loading="activeSessionState!.isComparing || activeSessionState!.isSyncing"
    class="diff-file-table"
    :data="activeSessionState!.tableData"
    height="100%"
    row-key="id"
    :cell-style="cellStyle"
    :row-class-name="rowClassName"
    lazy
    :load="load"
    :tree-props="{ children: 'children', hasChildren: 'isDirectory' }"
    border
  >
    <el-table-column
      prop="fileName"
      :label="$t('views.fileSync.fileName')"
      :min-width="220"
      resizable
      fixed
    >
      <template #default="{ row }">
        <FileNameWithIcon
          :file-name="row.fileName"
          :is-directory="row.isDirectory"
          :resolution="row.resolution"
        ></FileNameWithIcon>
      </template>
    </el-table-column>
    <el-table-column prop="leftSize" :label="$t('views.fileSync.leftSize')" :min-width="120">
      <template #default="{ row }">
        {{ getFileSize('source', row) }}
      </template>
    </el-table-column>
    <el-table-column prop="leftDate" :label="$t('views.fileSync.leftDate')" :min-width="200">
      <template #default="{ row }">
        {{ getFormatDate('source', row) }}
      </template>
    </el-table-column>
    <el-table-column
      prop="resolution"
      :label="$t('views.fileSync.resolution')"
      :min-width="150"
      align="center"
    >
      <template #default="{ row }">
        <SyncResolution
          :id="row.id"
          v-model:type="row.resolution"
          v-model:byte="row.transferBytes"
          :is-directory="row.isDirectory"
          :source="row.source"
          :destination="row.destination"
          :to-left-count="row.toLeftCount"
          :to-right-count="row.toRightCount"
          @change="handleResolutionChange"
        ></SyncResolution>
      </template>
    </el-table-column>
    <el-table-column prop="rightSize" :label="$t('views.fileSync.rightSize')" :min-width="120">
      <template #default="{ row }">
        {{ getFileSize('destination', row) }}
      </template>
    </el-table-column>
    <el-table-column prop="rightDate" :label="$t('views.fileSync.rightDate')" :min-width="200">
      <template #default="{ row }">
        {{ getFormatDate('destination', row) }}
      </template>
    </el-table-column>
  </el-table>
</template>

<style lang="less" scoped>
.diff-file-table {
  --el-table-fixed-left-column: none;
  --el-table-fixed-right-column: none;
  box-shadow: none;
}

:deep(.grey-row) {
  color: var(--el-text-color-placeholder) !important;
}

:deep(.el-table__row) {
  .cell {
    display: flex;
    align-items: center;
  }
}
</style>

<script setup lang="ts">
import FileNameWithIcon from './cells/FileNameWithIcon.vue'
import SyncResolution from './cells/SyncResolution.vue'
import { useFileList } from '@renderer/composables/file-sync/useFileList'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { TableColumnCtx } from 'element-plus'
import { changeColor } from 'seemly'
import { formatBytes } from '@renderer/utils/format'
import dayjs from 'dayjs'

const { diffFileList } = useFileList()
const { isComparing, isSyncing } = useSyncForm()

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
  const result = await window.ipc.sync.getDiffItems(row.id)

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
</script>

<template>
  <el-table
    v-loading="isComparing || isSyncing"
    class="diff-file-table"
    :data="diffFileList"
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
      :min-width="120"
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
:deep(.grey-row) {
  color: rgba(100, 100, 100, 0.5) !important;
}

:deep(.el-table__row) {
  .cell {
    display: flex;
    align-items: center;
  }
}
</style>

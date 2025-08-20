import { formatBytes } from '@renderer/utils/format'
import dayjs from 'dayjs'
import { changeColor } from 'seemly'
import { ref } from 'vue'
import { VxeTablePropTypes } from 'vxe-table'

const diffFileList = ref<FileDifference[]>([])
const expandedRowKeys = ref<string[]>([])

const cellStyle: VxeTablePropTypes.CellStyle<FileDifference> = ({ row, column }) => {
  if (row.isDirectory) return {}

  const successColor = changeColor('#67C23A', { alpha: 0.1 })
  const infoColor = changeColor('#409EFF', { alpha: 0.1 })
  const errorColor = changeColor('#F56C6C', { alpha: 0.1 })

  let type = ''
  if (column.field.includes('left')) {
    type = 'source'
  } else if (column.field.includes('right')) {
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

const rowClassName: VxeTablePropTypes.RowClassName<FileDifference> = ({ row }) => {
  if (row.resolution === 'ignore') {
    return 'grey-row'
  }

  return ''
}

function getFormatDate(type: 'source' | 'destination', differenceItem: FileDifference) {
  if (differenceItem.isDirectory) {
    return '-'
  }
  const target = type === 'source' ? differenceItem.source : differenceItem.destination
  if (!target) return ''
  else {
    return dayjs(target.timestamp).format('YYYY-MM-DD HH:mm:ss')
  }
}

function getFileSize(type: 'source' | 'destination', differenceItem: FileDifference) {
  if (differenceItem.isDirectory) {
    return '-'
  }
  const target = type === 'source' ? differenceItem.source : differenceItem.destination
  if (!target) return ''
  else {
    return formatBytes(target.size)
  }
}

export function useFileList() {
  return {
    expandedRowKeys,
    diffFileList,
    cellStyle,
    rowClassName,
    getFormatDate,
    getFileSize,
  }
}

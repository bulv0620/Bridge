import { changeColor } from 'seemly'
import { ref, watch } from 'vue'

const diffFileList = ref<FileDifference[]>([])
const expandedRowKeys = ref<string[]>([])

function getCellProps(row: FileDifference, type: 'source' | 'destination') {
  if (row.isDirectory) return {}

  const successColor = changeColor('#67C23A', { alpha: 0.2 })
  const infoColor = changeColor('#409EFF', { alpha: 0.2 })
  const errorColor = changeColor('#F56C6C', { alpha: 0.2 })

  const filePresent = type === 'source' ? !!row.source : !!row.destination
  const isLeft = row.resolution === 'toLeft'
  const isRight = row.resolution === 'toRight'

  const mkStyle = (bg: string, strike = false) =>
    strike
      ? { style: { background: bg, textDecoration: 'line-through' } }
      : { style: { background: bg } }

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

function getRowClassName(rowData: FileDifference) {
  if (rowData.resolution === 'ignore') {
    return 'grey-row'
  }

  return ''
}

function collectIdsWithChildren(data: FileDifference[]): string[] {
  const result: string[] = []

  function traverse(node: FileDifference) {
    if (node.children && node.children.length > 0) {
      result.push(node.id)
      node.children.forEach(traverse)
    }
  }

  data.forEach(traverse)
  return result
}

watch(diffFileList, () => {
  expandedRowKeys.value = collectIdsWithChildren(diffFileList.value)
})

export function useFileList() {
  return {
    expandedRowKeys,
    diffFileList,
    getCellProps,
    getRowClassName,
  }
}

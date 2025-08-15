import { DataTableInst } from 'naive-ui'
import { changeColor } from 'seemly'
import { ref, useTemplateRef, watch } from 'vue'

const diffFileList = ref<DiffInfo[]>([])
const diffFileTableRef = useTemplateRef<DataTableInst>('diffFileTableRef')
const expandedRowKeys = ref<string[]>([])

function getCellProps(row: DiffInfo, type: 'source' | 'target') {
  if (row.isDirectory) return {}

  const successColor = changeColor('#67C23A', { alpha: 0.2 })
  const infoColor = changeColor('#409EFF', { alpha: 0.2 })
  const errorColor = changeColor('#F56C6C', { alpha: 0.2 })

  const filePresent = type === 'source' ? !!row.sourceFile : !!row.targetFile
  const isLeft = row.action === 'toLeft'
  const isRight = row.action === 'toRight'

  const mkStyle = (bg: string, strike = false) =>
    strike
      ? { style: { background: bg, textDecoration: 'line-through' } }
      : { style: { background: bg } }

  // 语义化条件
  const presentAndRemoved =
    filePresent && ((type === 'source' && isLeft) || (type === 'target' && isRight))
  const presentAndAdded =
    filePresent && ((type === 'source' && isRight) || (type === 'target' && isLeft))
  const absentAndAdded =
    !filePresent && ((type === 'source' && isLeft) || (type === 'target' && isRight))

  if (presentAndRemoved) return mkStyle(errorColor, true)
  if (presentAndAdded) return mkStyle(infoColor)
  if (absentAndAdded) return mkStyle(successColor)

  return {}
}

function getRowClassName(rowData: DiffInfo) {
  if (rowData.action === 'ignore') {
    return 'grey-row'
  }

  return ''
}

function collectIdsWithChildren(data: DiffInfo[]): string[] {
  const result: string[] = []

  function traverse(node: DiffInfo) {
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
    diffFileTableRef,
    getCellProps,
    getRowClassName,
  }
}

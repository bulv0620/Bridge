import { computed, ref } from 'vue'
import { DataTableBaseColumn, DataTableFilterState } from 'naive-ui'
import { DiffFile, EDiffStatus } from './useSyncTool'

const diffTableData = ref<DiffFile[]>([])

const filterOptionValues = ref<string[]>([])
const tableRef = ref<any>()

const hasWaitingFile = computed(() => {
  return diffTableData.value.some((diffFile: DiffFile) => {
    return diffFile.status === EDiffStatus.waiting
  })
})

const scrollTo = (index: number) => {
  tableRef.value?.scrollTo({ index })
}

const clearTypeFilter = () => {
  filterOptionValues.value = []
}

const handleUpdateFilter = (filters: DataTableFilterState, sourceColumn: DataTableBaseColumn) => {
  filterOptionValues.value = filters[sourceColumn.key] as any
}

export function useDiffList() {
  return {
    diffTableData,
    filterOptionValues,
    tableRef,
    hasWaitingFile,
    scrollTo,
    clearTypeFilter,
    handleUpdateFilter,
  }
}

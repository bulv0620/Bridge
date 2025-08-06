import { computed, ref } from 'vue'
import { DataTableBaseColumn, DataTableFilterState } from 'naive-ui'
import { DiffFile, EDiffStatus } from './useSyncTool'

const loading = ref(false)

const diffTableData = ref<DiffFile[]>([])

const filterOptionValues = ref<string[]>([])
const tableRef = ref<any>()

const processing = computed(function () {
  return diffTableData.value.some(function (diffFile) {
    return diffFile.status === EDiffStatus.processing
  })
})
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
    loading,
    diffTableData,
    filterOptionValues,
    tableRef,
    processing,
    hasWaitingFile,
    scrollTo,
    clearTypeFilter,
    handleUpdateFilter,
  }
}

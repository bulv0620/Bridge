<script setup lang="ts">
import { Sync, FileTrayFull, SaveOutline } from '@vicons/ionicons5'
import { computed, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FolderSelectionInput from './components/folder-selection-input/FolderSelectionInput.vue'
import type { FolderInfo } from './components/folder-selection-input/FolderSelectionInput.vue'
import {
  DiffFile,
  diffFileListsUnified,
  FtpFileSystem,
  LocalFileSystem,
} from '@renderer/utils/file-system'
import { NTag } from 'naive-ui'

const { t } = useI18n()

const syncOptions = computed(() => [
  { label: t('views.backpack.twoWaySync'), value: 'two-way' },
  { label: t('views.backpack.mirrorSync'), value: 'mirror' },
  { label: t('views.backpack.incrementalSync'), value: 'increment' },
])

const syncType = ref('two-way')

const percentage = ref(0)

const loading = ref(false)

const sourceFolder = ref<FolderInfo>({
  type: '',
  path: '',
})
const targetFolder = ref<FolderInfo>({
  type: '',
  path: '',
})

const diffTableData = ref([])
const columns = computed(() => [
  {
    title: '序号',
    key: 'index',
    align: 'center',
    width: 60,
    render(_: DiffFile, index: number) {
      return index + 1
    },
  },
  {
    title: '差异类型',
    key: 'diffType',
    align: 'center',
    width: 140,
    filterOptions: [
      {
        label: t('views.backpack.onlySource'),
        value: 'onlySource',
      },
      {
        label: t('views.backpack.onlyTarget'),
        value: 'onlyTarget',
      },
      {
        label: t('views.backpack.conflict'),
        value: 'conflict',
      },
    ],
    filter(value: string, row: DiffFile) {
      return row.diffType === value
    },
    render(row: DiffFile) {
      return h(
        NTag,
        {
          type:
            row.diffType === 'onlySource'
              ? 'success'
              : row.diffType === 'onlyTarget'
                ? 'warning'
                : 'error',
        },
        () => t(`views.backpack.${row.diffType}`),
      )
    },
  },
  {
    title: '源文件',
    key: 'sourceFileName',
    align: 'center',
    resizable: true,
    render(row: DiffFile) {
      return row.source?.fileName
    },
  },
  {
    title: '目标文件',
    key: 'targetFileName',
    align: 'center',
    resizable: true,
    render(row: DiffFile) {
      return row.target?.fileName
    },
  },
  {
    title: '操作',
    key: 'operation',
    align: 'center',
    width: 100,
  },
])

const handleDiffClick = async () => {
  try {
    loading.value = true

    if (!sourceFolder.value.path || !targetFolder.value.path) {
      return
    }

    let source: LocalFileSystem | FtpFileSystem
    let target: LocalFileSystem | FtpFileSystem

    if (sourceFolder.value.type === 'local') {
      source = new LocalFileSystem(sourceFolder.value.path)
    } else {
      source = new FtpFileSystem(sourceFolder.value.ftpConfig!, sourceFolder.value.path)
    }
    if (targetFolder.value.type === 'local') {
      target = new LocalFileSystem(targetFolder.value.path)
    } else {
      target = new FtpFileSystem(targetFolder.value.ftpConfig!, targetFolder.value.path)
    }

    const sourceFiles = await source.getAllFiles()
    const targetFiles = await target.getAllFiles()

    const diff = diffFileListsUnified(sourceFiles, targetFiles)

    diffTableData.value = diff as any

    if (source instanceof FtpFileSystem) {
      source.disconnect()
    }
    if (target instanceof FtpFileSystem) {
      target.disconnect()
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="backpack-sync">
    <div class="container">
      <n-flex justify="space-between">
        <p class="title">
          <span>{{ $t('views.backpack.newPlan') }}</span>
        </p>
        <n-button strong circle>
          <template #icon>
            <n-icon> <FileTrayFull /> </n-icon>
          </template>
        </n-button>
      </n-flex>

      <n-flex :wrap="false">
        <FolderSelectionInput v-model:value="sourceFolder" type="source"></FolderSelectionInput>
        <n-button
          strong
          circle
          :disabled="!sourceFolder.path || !targetFolder.path"
          :loading="loading"
          @click="handleDiffClick"
        >
          <template #icon>
            <n-icon> <Sync /> </n-icon>
          </template>
        </n-button>
        <FolderSelectionInput v-model:value="targetFolder" type="target"></FolderSelectionInput>
      </n-flex>

      <n-flex :wrap="false">
        <n-select v-model:value="syncType" :options="syncOptions" style="width: 180px" />
        <n-button :disabled="diffTableData.length === 0">
          <template #icon>
            <n-icon> <Sync /> </n-icon>
          </template>
          {{ $t('views.backpack.startSync') }}
        </n-button>
        <n-button :disabled="!sourceFolder.path || !targetFolder.path">
          <template #icon>
            <n-icon> <SaveOutline /> </n-icon>
          </template>
          {{ $t('views.backpack.savePlan') }}
        </n-button>
      </n-flex>

      <n-progress
        processing
        status="success"
        type="line"
        :percentage="percentage"
        :show-indicator="false"
      />

      <div class="table-wrapper">
        <n-data-table
          :loading="loading"
          size="small"
          align="center"
          virtual-scroll
          :columns="columns"
          :data="diffTableData"
          flex-height
          style="height: 100%"
        />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.backpack-sync {
  padding: 18px;
  height: calc(100vh - 69px);

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .title {
      height: 100%;
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: large;
      font-weight: 400;
    }

    .table-wrapper {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>

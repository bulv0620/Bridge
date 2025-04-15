<script setup lang="ts">
import { Sync, FileTrayFull, SaveOutline } from '@vicons/ionicons5'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FolderSelectionInput from './components/folder-selection-input/FolderSelectionInput.vue'
import type { FolderInfo } from './components/folder-selection-input/FolderSelectionInput.vue'
import {
  DiffFile,
  diffFileListsUnified,
  EDiffAction,
  EDiffStatus,
  EDiffType,
  FtpFileSystem,
  LocalFileSystem,
} from '@renderer/utils/file-system'
import { NIcon } from 'naive-ui'
import DiffDataTable from './components/diff-data-table/DiffDataTable.vue'

const crypto = window.api.crypto
const { t } = useI18n()

const loading = ref(false)
const percentage = ref(0)

const sourceFolder = ref<FolderInfo>({
  type: '',
  path: '',
})
const targetFolder = ref<FolderInfo>({
  type: '',
  path: '',
})

const diffTableData = ref<DiffFile[]>([])

watch(sourceFolder, () => {
  diffTableData.value = []
})
watch(targetFolder, () => {
  diffTableData.value = []
})

enum ESyncType {
  mirror = 'mirror',
  twoWay = 'two-way',
  increment = 'increment',
}
const syncOptions = computed(() => [
  { label: t('views.backpack.mirrorSync'), value: ESyncType.mirror },
  { label: t('views.backpack.twoWaySync'), value: ESyncType.twoWay },
  { label: t('views.backpack.incrementalSync'), value: ESyncType.increment },
])
const syncType = ref(ESyncType.mirror)
watch(syncType, (type) => {
  diffTableData.value.forEach((diffFile) => {
    diffFile.action = getDiffAction(diffFile, type)
  })
})

const getDiffAction = (diffFile: DiffFile, syncType: ESyncType): EDiffAction => {
  switch (syncType) {
    case ESyncType.mirror:
      // 镜像模式下，无论 diffFile.diffType 为何均同步为右侧
      return EDiffAction.toRight

    case ESyncType.twoWay:
      // 双向同步，根据 diffFile.diffType 决定方向
      switch (diffFile.diffType) {
        case EDiffType.onlySource:
          return EDiffAction.toRight
        case EDiffType.onlyTarget:
          return EDiffAction.toLeft
        case EDiffType.conflict:
          return EDiffAction.conflict
        default:
          throw new Error(`未处理的 diffType:${diffFile.diffType}`)
      }

    case ESyncType.increment:
      // 增量同步
      switch (diffFile.diffType) {
        case EDiffType.onlySource:
          return EDiffAction.toRight
        case EDiffType.onlyTarget:
          return EDiffAction.ignore
        case EDiffType.conflict:
          return EDiffAction.toRight
        default:
          throw new Error(`未处理的 diffType:${diffFile.diffType}`)
      }

    default:
      throw new Error(`未处理的 syncType:${syncType}`)
  }
}

const handleDiffClick = async () => {
  diffTableData.value = []
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

    diffTableData.value = diff.map((diffFile) => ({
      key: crypto.randomUUID(),
      ...diffFile,
      action: getDiffAction(diffFile, syncType.value),
      status: EDiffStatus.wait,
    }))

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
        <DiffDataTable v-model:data="diffTableData" :loading="loading"></DiffDataTable>
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

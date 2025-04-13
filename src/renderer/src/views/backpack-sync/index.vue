<script setup lang="ts">
import { Sync, FileTrayFull, SaveOutline } from '@vicons/ionicons5'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FolderSelectionInput from './components/folder-selection-input/FolderSelectionInput.vue'
import type { IFolderInfo } from './components/folder-selection-input/FolderSelectionInput.vue'

const { t } = useI18n()

const syncOptions = computed(() => [
  { label: t('views.backpack.twoWaySync'), value: 'two-way' },
  { label: t('views.backpack.mirrorSync'), value: 'mirror' },
  { label: t('views.backpack.incrementalSync'), value: 'increment' },
])

const syncType = ref('two-way')

const tableData = ref([])
const columns = computed(() => [
  {
    title: 'Name',
    key: 'name',
  },
  {
    title: 'Age',
    key: 'age',
  },
  {
    title: 'Address',
    key: 'address',
  },
  {
    title: 'Tags',
    key: 'tags',
  },
  {
    title: 'Action',
    key: 'actions',
  },
])
const percentage = ref(0)

const sourceFolder = ref<IFolderInfo>({
  type: '',
  path: '',
})
const targetFolder = ref<IFolderInfo>({
  type: '',
  path: '',
})
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
        <n-button strong circle :disabled="!sourceFolder.path || !targetFolder.path">
          <template #icon>
            <n-icon> <Sync /> </n-icon>
          </template>
        </n-button>
        <FolderSelectionInput v-model:value="targetFolder" type="target"></FolderSelectionInput>
      </n-flex>

      <n-flex :wrap="false">
        <n-select v-model:value="syncType" :options="syncOptions" style="width: 180px" />
        <n-button>
          <template #icon>
            <n-icon> <Sync /> </n-icon>
          </template>
          {{ $t('views.backpack.startSync') }}
        </n-button>
        <n-button>
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
          striped
          virtual-scroll
          :columns="columns"
          :data="tableData"
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

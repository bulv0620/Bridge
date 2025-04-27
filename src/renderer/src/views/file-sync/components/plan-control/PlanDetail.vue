<script setup lang="ts">
import { computed } from 'vue'
import { PlanInfo } from './PlanControl.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  plan: PlanInfo
}>()

const { t } = useI18n()

// 定义数据表的列配置
const columns = computed(() => [
  {
    title: '',
    key: 'prop',
    align: 'left',
    width: 120,
  },
  {
    title: t('views.fileSync.sourceFolder'),
    key: 'source',
    align: 'left',
    ellipsis: { tooltip: true },
  },
  {
    title: t('views.fileSync.targetFolder'),
    key: 'target',
    align: 'left',
    ellipsis: { tooltip: true },
  },
])

// 构造表格数据
const tableData = computed(() => [
  {
    prop: t('views.fileSync.folderType'),
    source: props.plan.sourceFolder.type || '-',
    target: props.plan.targetFolder.type || '-',
  },
  {
    prop: t('views.fileSync.folderPath'),
    source: props.plan.sourceFolder.path,
    target: props.plan.targetFolder.path,
  },
])
</script>

<template>
  <n-card size="small">
    <NSpace direction="vertical" style="width: 100%">
      <n-data-table
        :columns="columns"
        :data="tableData"
        size="small"
        single-line="false"
        bordered
      />

      <n-space>
        <strong>{{ $t('views.fileSync.folderWhiteList') }}</strong>
        <NSpace wrap>
          <n-tag v-for="(item, idx) in props.plan.folderWhiteList" :key="idx" type="info">
            {{ item }}
          </n-tag>
        </NSpace>
      </n-space>
    </NSpace>
  </n-card>
</template>

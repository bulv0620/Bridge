<script setup lang="ts">
import { useSyncPlan } from '@renderer/composables/file-sync/useSyncPlan'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'

const { planListModalVisible, planList, selectPlan, removePlan } = useSyncPlan()
const { t } = useI18n()
</script>

<template>
  <!-- 使用你的通用模态框 -->
  <CommonDialog
    v-model:visible="planListModalVisible"
    :title="$t('views.fileSync.savedPlans')"
    width="600px"
    :show-confirm="false"
  >
    <!-- 表格内容 -->
    <el-table :data="planList" height="260" style="width: 100%">
      <!-- 名称 -->
      <el-table-column :label="t('views.fileSync.planName')" prop="name" />

      <!-- 时间戳 -->
      <el-table-column :label="t('views.fileSync.timestamp')">
        <template #default="{ row }">
          {{ dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
      </el-table-column>

      <!-- 操作区域 -->
      <el-table-column :label="t('views.fileSync.actions')" width="180">
        <template #default="{ row }">
          <el-button size="small" type="primary" style="margin-right: 8px" @click="selectPlan(row)">
            {{ t('common.select') }}
          </el-button>

          <el-button size="small" type="danger" @click="removePlan(row)">
            {{ t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </CommonDialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import * as ElIcon from '@element-plus/icons-vue'

export interface CommonDialogProps {
  title?: string
  width?: string | number
  onConfirm?: () => Promise<any>
  beforeClose?: () => Promise<any>
  afterClose?: () => Promise<any>
  showCancel?: boolean
  showConfirm?: boolean
}

const props = withDefaults(defineProps<CommonDialogProps>(), {
  title: () => '弹窗',
  width: () => '50%',
  showCancel: () => true,
  showConfirm: () => true,
})

const isVisible = defineModel<boolean>('visible', { required: true }) // 弹窗显示

const dialogRef = ref<any>(false) // div
const loading = ref<boolean>(false) // 加载状态

/** 关闭 */
const handleClose = async () => {
  if (props.beforeClose) {
    await props.beforeClose() // 关闭前置钩子
  }

  isVisible.value = false

  if (props.afterClose) {
    await props.afterClose() // 关闭后置钩子
  }
}

/** 确定 */
const handleConfirm = async () => {
  if (loading.value) return
  try {
    loading.value = true

    if (props.onConfirm) {
      await props.onConfirm() // 保存事件
    }

    isVisible.value = false
  } catch (error) {
    error
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div ref="dialogRef" v-dialog-drag>
      <el-dialog
        v-model="isVisible"
        :title="title"
        :width="width"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
      >
        <template #header="{ titleId, titleClass }">
          <div class="my-header">
            <el-text :id="titleId" size="large" type="primary" :class="titleClass">
              {{ title }}
            </el-text>
            <div class="my-header__btn">
              <el-button size="small" text :icon="ElIcon.CloseBold" @click.stop="handleClose" />
            </div>
          </div>
        </template>
        <slot :visible="isVisible"></slot>

        <template #footer>
          <div class="dialog-footer">
            <slot name="footer">
              <el-button v-if="showCancel" @click="handleClose">{{
                $t('common.cancel')
              }}</el-button>
              <el-button
                v-if="showConfirm"
                type="primary"
                :loading="loading"
                @click="handleConfirm"
              >
                {{ $t('common.confirm') }}
              </el-button>
            </slot>
          </div>
        </template>
      </el-dialog>
    </div>
  </Teleport>
</template>

<style scoped lang="less">
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: var(--el-color-primary-light-5) 1px solid;
}

.button-box {
  top: 0;
  right: 0;
  position: absolute;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer {
  padding: 8px 12px;
  padding-top: 0;
}

:deep(.el-dialog) {
  padding: 0;
}

:deep(.el-dialog__body) {
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-dialog__header) {
  padding: 0;
}

:deep(.el-dialog__footer) {
  padding: 0;
}
</style>

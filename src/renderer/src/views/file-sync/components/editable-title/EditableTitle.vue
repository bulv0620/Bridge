<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'
import { FiberNewFilled } from '@vicons/material'
import { ElInput } from 'element-plus'

const { syncForm } = useSyncForm()

const isEditing = ref(false)
const tempValue = ref('')
const inputRef = ref<InstanceType<typeof ElInput> | null>(null)

const startEdit = async () => {
  tempValue.value = syncForm.name
  isEditing.value = true
  await nextTick()

  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

const confirmEdit = () => {
  if (!isEditing.value) return
  if (tempValue.value === '') {
    isEditing.value = false
    return
  }
  isEditing.value = false
  if (tempValue.value !== syncForm.name) {
    syncForm.name = tempValue.value
  }
}

watch(
  () => syncForm.name,
  () => {
    isEditing.value = false
  },
)
</script>

<template>
  <div style="display: inline-block" @click="!isEditing && startEdit()">
    <!-- 显示模式 -->
    <span v-if="!isEditing" style="font-size: 16px; font-weight: 400; cursor: text">
      {{ syncForm.name }}
    </span>
    <!-- 编辑模式 -->
    <el-input
      v-else
      ref="inputRef"
      v-model="tempValue"
      class="inline-editor-input"
      style="width: auto; min-width: 100px"
      autofocus
      @change="confirmEdit"
      @blur="confirmEdit"
    />

    <el-icon v-if="!syncForm.id" style="margin-left: 6px; color: var(--el-color-primary)">
      <FiberNewFilled></FiberNewFilled>
    </el-icon>
  </div>
</template>

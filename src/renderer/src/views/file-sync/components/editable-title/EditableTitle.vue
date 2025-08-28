<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { NInput } from 'naive-ui'
import { useSyncForm } from '@renderer/composables/file-sync/useSyncForm'

const { syncForm } = useSyncForm()

const isEditing = ref(false)
const tempValue = ref('')
const inputRef = ref<InstanceType<typeof NInput> | null>(null)

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
    <n-input
      v-else
      ref="inputRef"
      v-model:value="tempValue"
      class="inline-editor-input"
      size="small"
      input-grade="secondary"
      style="width: auto; min-width: 100px"
      autofocus
      @change="confirmEdit"
      @blur="confirmEdit"
    />
  </div>
</template>

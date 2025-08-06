<script setup lang="ts">
import { useFtpClient } from '@renderer/composables/ftp-client/useFtpClient'
import { FolderOpen } from '@vicons/ionicons5'
import { computed } from 'vue'

const { currentInstancePath } = useFtpClient()

const dropdownOptions = computed(() => {
  // 只包含被折叠的中间层级
  if (!currentInstancePath.value || currentInstancePath.value.length <= 3) return []
  return currentInstancePath.value
    .slice(1, currentInstancePath.value.length - 2)
    .map((path: string, idx: number) => ({
      label: path || '(ROOT)',
      key: idx + 1, // 对应真实的 index
    }))
})

const handleDropdownSelect = (key: number) => {
  // 跳转到选中的层级
  currentInstancePath.value.splice(key + 1)
}
</script>

<template>
  <n-breadcrumb>
    <!-- 层级小于等于3，全部展示 -->
    <template v-if="!currentInstancePath || currentInstancePath.length <= 3">
      <n-breadcrumb-item
        v-for="(path, index) in currentInstancePath"
        :key="path + index"
        @click="currentInstancePath.splice(index + 1)"
      >
        <n-icon :component="FolderOpen" color="#f9a825" /> {{ path || '(ROOT)' }}
      </n-breadcrumb-item>
    </template>
    <!-- 层级大于3，折叠中间层级 -->
    <template v-else>
      <!-- 第一个 -->
      <n-breadcrumb-item :key="'root'" @click="currentInstancePath.splice(1)">
        <n-icon :component="FolderOpen" color="#f9a825" />
        {{ currentInstancePath[0] || '(ROOT)' }}
      </n-breadcrumb-item>
      <!-- 折叠部分 -->
      <n-breadcrumb-item :key="'ellipsis'">
        <n-dropdown trigger="click" :options="dropdownOptions" @select="handleDropdownSelect">
          <span style="cursor: pointer">...</span>
        </n-dropdown>
      </n-breadcrumb-item>
      <!-- 倒数第二和最后一个 -->
      <n-breadcrumb-item
        v-for="(path, index) in currentInstancePath.slice(-2)"
        :key="path + (currentInstancePath.length - 2 + index)"
        @click="currentInstancePath.splice(currentInstancePath.length - 2 + index + 1)"
      >
        <n-icon :component="FolderOpen" color="#f9a825" /> {{ path || '(ROOT)' }}
      </n-breadcrumb-item>
    </template>
  </n-breadcrumb>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 双向绑定选择的路径
const selectedPath = defineModel<string>('selectedPath', { required: true })

// 根节点
const data = ref([
  {
    id: '/',
    label: 'root',
    children: [],
    leaf: false,
  },
])

/**
 * 异步加载子节点
 */
async function loadNode(node: any, resolve: any) {
  // node.level === 0 为根（虚拟节点），跳过
  if (node.level === 0) return resolve(data.value)

  const nodeData = node.data
  const list = await window.ipc.sync.listInstance(nodeData.id)

  const children = list.map((el: any) => ({
    id: el.filePath,
    label: el.fileName,
    children: [],
    leaf: false,
  }))

  resolve(children)
}

/**
 * 处理节点选择
 */
function handleNodeClick(data: any) {
  selectedPath.value = data.id
}
</script>

<template>
  <div>
    <el-text>
      <span style="margin-right: 8px">{{ $t('views.fileSync.selectedPath') }}:</span>
      <el-text type="primary">{{ selectedPath || '/' }}</el-text>
    </el-text>
  </div>

  <el-scrollbar height="190px">
    <el-tree
      :data="data"
      node-key="id"
      highlight-current
      lazy
      :load="loadNode"
      :expand-on-click-node="false"
      @node-click="handleNodeClick"
    >
    </el-tree>
  </el-scrollbar>
</template>

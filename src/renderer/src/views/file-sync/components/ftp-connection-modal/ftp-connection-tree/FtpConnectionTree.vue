<script setup lang="ts">
import { Folder, FolderOpenOutline } from '@vicons/ionicons5'
import { NIcon, TreeOption } from 'naive-ui'
import { h, ref } from 'vue'

// 绑定选中的 key
const selectedPath = defineModel<Array<string>>('selectedPath', { required: true })

const data = ref([
  {
    key: '/',
    label: 'root',
    prefix: () =>
      h(NIcon, null, {
        default: () => h(Folder),
      }),
    isLeaf: false,
  },
])

function updatePrefixWithExpaned(
  _keys: Array<string | number>,
  _option: Array<TreeOption | null>,
  meta: {
    node: TreeOption | null
    action: 'expand' | 'collapse' | 'filter'
  },
) {
  if (!meta.node) return
  switch (meta.action) {
    case 'expand':
      meta.node.prefix = () =>
        h(NIcon, null, {
          default: () => h(FolderOpenOutline),
        })
      break
    case 'collapse':
      meta.node.prefix = () =>
        h(NIcon, null, {
          default: () => h(Folder),
        })
      break
  }
}

// 异步加载子节点
async function handleLoad(node: TreeOption) {
  const list = await window.ipc.sync.listInstance(node.key as string)

  node.children = list.map((el) => ({
    key: el.filePath,
    label: el.fileName,
    prefix: () =>
      h(NIcon, null, {
        default: () => h(Folder),
      }),
    isLeaf: false,
  }))
}
</script>

<template>
  <n-p>
    <n-ellipsis style="width: 100%">
      <span style="margin-right: 8px">{{ $t('views.fileSync.selectedPath') }}:</span>
      <n-a>{{ selectedPath[0] || '/' }}</n-a>
    </n-ellipsis>
  </n-p>
  <n-scrollbar style="height: 190px">
    <n-tree
      v-model:selected-keys="selectedPath"
      block-line
      show-line
      :data="data"
      :on-update:expanded-keys="updatePrefixWithExpaned"
      :on-load="handleLoad"
    />
  </n-scrollbar>
</template>

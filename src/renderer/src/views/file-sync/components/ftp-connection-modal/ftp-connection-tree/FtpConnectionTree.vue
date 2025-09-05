<script setup lang="ts">
import { Folder, FolderOpenOutline } from '@vicons/ionicons5'
import { NIcon, TreeOption } from 'naive-ui'
import { h, ref } from 'vue'

const data = ref([
  {
    key: '文件夹',
    label: '文件夹',
    prefix: () =>
      h(NIcon, null, {
        default: () => h(Folder),
      }),
    children: [
      {
        key: '空的',
        label: '空的',
        prefix: () =>
          h(NIcon, null, {
            default: () => h(Folder),
          }),
      },
      {
        key: '我的文件',
        label: '我的文件',
        prefix: () =>
          h(NIcon, null, {
            default: () => h(Folder),
          }),
        children: [],
      },
    ],
  },
])

function nodeProps({ option }: { option: TreeOption }) {
  return {
    onClick() {
      if (!option.children && !option.disabled) {
        // message.info(`[Click] ${option.label}`)
      }
    },
  }
}

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
</script>

<template>
  <n-scrollbar style="height: 228px">
    <n-tree
      block-line
      show-line
      expand-on-click
      :data="data"
      :node-props="nodeProps"
      :on-update:expanded-keys="updatePrefixWithExpaned"
    />
  </n-scrollbar>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useTheme } from '@renderer/composables/theme'

const props = defineProps({
  language: {
    type: String,
    default: 'json',
  },
  height: {
    type: String,
    default: '160px',
  },
  value: {
    type: String,
    default: '{}',
  },
})

const { currentTheme } = useTheme()

const emit = defineEmits(['update:value'])

const editorRef = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

watch(
  () => props.value,
  (val) => {
    const currentValue = editor?.getValue()
    if (currentValue && currentValue === val) return

    editor?.setValue(val)

    editor?.getAction('editor.action.formatDocument')?.run()
  },
)

onMounted(() => {
  if (editorRef.value) {
    editor = monaco.editor.create(editorRef.value, {
      value: props.value,
      language: props.language,
      theme: currentTheme.value === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      minimap: { enabled: false }, // 隐藏代码地图
      lineNumbers: 'off', // 隐藏行号
      glyphMargin: false, // 隐藏左侧边距
    })

    editor?.getAction('editor.action.formatDocument')?.run()

    editor.onDidChangeModelContent(() => {
      const value = editor?.getValue()
      if (value !== undefined) {
        emit('update:value', value)
      }
    })
  }
})

onBeforeUnmount(() => {
  editor?.dispose?.()
})
</script>

<template>
  <div ref="editorRef" class="code-editor" :style="{ width: '100%', height }"></div>
</template>

<style lang="less" scoped>
.code-editor {
  border: 1px solid var(--el-input-border-color, var(--el-border-color));
  border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
}
</style>

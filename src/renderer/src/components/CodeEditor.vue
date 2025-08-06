<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useTheme } from '@renderer/composables/setting/useTheme'

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
  disabled: {
    type: Boolean,
    default: false,
  },
})

const { currentTheme } = useTheme()
const emit = defineEmits(['update:value'])

const editorRef = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

// 同步外部 value 到编辑器
watch(
  () => props.value,
  (val) => {
    if (editor && editor.getValue() !== val) {
      editor.setValue(val)
      editor.getAction('editor.action.formatDocument')?.run()
    }
  },
)

// 动态切换只读模式
watch(
  () => props.disabled,
  (readOnly) => {
    editor?.updateOptions({ readOnly })
  },
)

onMounted(() => {
  if (editorRef.value) {
    editor = monaco.editor.create(editorRef.value, {
      value: props.value,
      language: props.language,
      theme: currentTheme.value === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      minimap: { enabled: false },
      lineNumbers: 'off',
      glyphMargin: false,
      // 通过 readOnly 控制可编辑性
      readOnly: props.disabled,
    })

    // 初始格式化
    editor.getAction('editor.action.formatDocument')?.run()

    // 监听编辑器内容变化
    editor.onDidChangeModelContent(() => {
      const v = editor?.getValue()
      if (v !== undefined) {
        emit('update:value', v)
      }
    })
  }
})

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div
    ref="editorRef"
    class="code-editor"
    :class="{ 'is-disabled': disabled }"
    :style="{ width: '100%', height }"
  ></div>
</template>

<style lang="less" scoped>
.code-editor {
  border: 1px solid var(--el-input-border-color, var(--el-border-color));
  border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
  transition: opacity 0.2s;
}

/* 禁用态：仅视觉提示，仍允许滚动与选中内容 */
.code-editor.is-disabled {
  opacity: 0.6;
}
</style>

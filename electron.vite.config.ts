import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [
      vue(),
      (monacoEditorPlugin as any).default({
        languageWorkers: ['editorWorkerService', 'json', 'typescript'],
        customDistPath: () => resolve(__dirname, 'out/renderer/monacoeditorwork'),
      }),
    ],
  },
})

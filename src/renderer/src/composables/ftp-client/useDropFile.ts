import { ref } from 'vue'
import { useFileUploadModal } from './useFileUploadModal'

const { openFileUploadModal } = useFileUploadModal()

const isDragging = ref(false)
let dragCounter = 0

function onDragEnter(e: DragEvent) {
  e.preventDefault()
  dragCounter++
  isDragging.value = true
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function onDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    isDragging.value = false
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  dragCounter = 0

  const files = e.dataTransfer?.files

  if (files?.length) {
    uploadFiles(Array.from(files).map((f) => f.path))
  }
}

function uploadFiles(files: string[]) {
  if (files.length > 0) {
    openFileUploadModal(files)
  }
}

export function useDropFiles() {
  return {
    isDragging,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  }
}

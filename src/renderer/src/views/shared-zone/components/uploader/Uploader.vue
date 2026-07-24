<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Close, Document, FolderOpened, Plus, UploadFilled } from '@element-plus/icons-vue'
import { useTaskList } from '@renderer/composables/share-zone/useTaskList'
import { formatBytes } from '@renderer/utils/format'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles, UploadInstance } from 'element-plus'
import { i18n } from '@renderer/locales'

const { files, replaceSelection, clearSelection } = useTaskList()
const uploadRef = ref<UploadInstance>()
const isDraggingFile = ref(false)
const detailVisible = ref(false)
const selectionUpdating = ref(false)
const selectedRawFiles = ref<File[]>([])
let dragDepth = 0
let uploadGeneration = 0
const totalSize = computed(() => files.value.reduce((sum, file) => sum + file.size, 0))

async function onFileChange(_uploadFile: UploadFile, uploadFiles: UploadFiles) {
  resetDragState()
  const generation = ++uploadGeneration
  await nextTick()
  if (generation !== uploadGeneration) return

  const rawFiles = uploadFiles.flatMap((file) => (file.raw ? [file.raw] : []))
  const applied = await replaceSelection(rawFiles)
  if (generation !== uploadGeneration) return

  if (applied) {
    selectedRawFiles.value = rawFiles
    return
  }

  selectedRawFiles.value = []
  uploadRef.value?.clearFiles()
}

function removeFiles() {
  uploadGeneration += 1
  detailVisible.value = false
  selectedRawFiles.value = []
  void clearSelection()
}

async function removeFile(index: number) {
  if (selectionUpdating.value) return

  const nextFiles = selectedRawFiles.value.filter((_, fileIndex) => fileIndex !== index)
  selectionUpdating.value = true
  try {
    if (nextFiles.length === 0) {
      removeFiles()
      return
    }

    const applied = await replaceSelection(nextFiles)
    if (applied) selectedRawFiles.value = nextFiles
  } finally {
    selectionUpdating.value = false
  }
}

function onExceed() {
  ElMessage({
    message: i18n.global.t('views.sharedZone.tooManyFiles'),
    type: 'warning',
    plain: true,
  })
}

function hasDraggedFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

function onDragEnter(event: DragEvent) {
  if (!hasDraggedFiles(event)) return

  dragDepth += 1
  isDraggingFile.value = true
}

function onDragOver(event: DragEvent) {
  if (!hasDraggedFiles(event) || !event.dataTransfer) return

  event.dataTransfer.dropEffect = 'copy'
}

function onDragLeave(event: DragEvent) {
  if (!hasDraggedFiles(event)) return

  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDraggingFile.value = false
}

function resetDragState() {
  dragDepth = 0
  isDraggingFile.value = false
}

watch(
  () => files.value.length,
  (fileCount) => {
    if (fileCount === 0) {
      detailVisible.value = false
      selectedRawFiles.value = []
    }
  },
)

onBeforeUnmount(() => {
  uploadGeneration += 1
  selectedRawFiles.value = []
  void clearSelection()
})
</script>

<template>
  <section class="upload-panel" :class="{ 'has-file': files.length }" aria-live="polite">
    <div v-if="files.length" class="file-summary">
      <span class="file-icon">
        <el-icon><Document /></el-icon>
      </span>
      <div class="file-info">
        <strong>{{ $t('views.sharedZone.selectedFiles', { count: files.length }) }}</strong>
        <div class="file-meta">
          <span>{{ formatBytes(totalSize) }}</span>
          <el-popover
            v-model:visible="detailVisible"
            placement="bottom-start"
            :width="360"
            trigger="click"
            popper-class="bridge-file-detail-popover"
          >
            <template #reference>
              <el-button link type="primary" class="show-details">
                {{ $t('views.sharedZone.showDetails') }}
              </el-button>
            </template>

            <div class="file-detail">
              <div class="file-detail-header">
                <strong>{{ $t('views.sharedZone.fileDetails') }}</strong>
                <span>{{ formatBytes(totalSize) }}</span>
              </div>
              <el-scrollbar max-height="280px">
                <div class="file-detail-list">
                  <div v-for="(item, index) in files" :key="item.id" class="file-detail-row">
                    <span class="file-detail-icon" aria-hidden="true">
                      <el-icon><Document /></el-icon>
                    </span>
                    <div class="file-detail-copy">
                      <strong :title="item.filename">{{ item.filename }}</strong>
                      <span>{{ formatBytes(item.size) }}</span>
                    </div>
                    <el-button
                      :icon="Close"
                      circle
                      text
                      class="remove-file"
                      :disabled="selectionUpdating"
                      :title="$t('views.sharedZone.removeFile', { name: item.filename })"
                      :aria-label="$t('views.sharedZone.removeFile', { name: item.filename })"
                      @click.stop="removeFile(index)"
                    />
                  </div>
                </div>
              </el-scrollbar>
            </div>
          </el-popover>
        </div>
      </div>
      <el-button
        :icon="Close"
        circle
        text
        class="clear-selection"
        :title="$t('views.sharedZone.clearSelectedFiles')"
        :aria-label="$t('views.sharedZone.clearSelectedFiles')"
        @click="removeFiles"
      />
    </div>

    <el-upload
      v-else
      ref="uploadRef"
      class="upload-comp"
      drag
      multiple
      :auto-upload="false"
      :show-file-list="false"
      :limit="256"
      :on-change="onFileChange"
      :on-exceed="onExceed"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop="resetDragState"
    >
      <div class="upload-illustration" aria-hidden="true">
        <span class="file-card file-card-back">
          <span class="file-lines"></span>
        </span>
        <span class="file-card file-card-front">
          <el-icon><Document /></el-icon>
          <span class="file-lines"></span>
        </span>
        <span class="add-badge">
          <el-icon><Plus /></el-icon>
        </span>
      </div>

      <div class="upload-copy">
        <strong>{{ $t('views.sharedZone.dropFilesTitle') }}</strong>
        <span class="upload-hint">{{ $t('views.sharedZone.dragFilesHint') }}</span>
      </div>

      <span class="choose-file-action">
        <el-icon><FolderOpened /></el-icon>
        {{ $t('views.sharedZone.chooseFile') }}
      </span>

      <span class="upload-sub-hint">{{ $t('views.sharedZone.batchUploadSubHint') }}</span>

      <Transition name="drop-overlay">
        <div v-if="isDraggingFile" class="drop-overlay" aria-hidden="true">
          <span class="drop-icon">
            <el-icon><UploadFilled /></el-icon>
          </span>
          <strong>{{ $t('views.sharedZone.dropFilesOverlay') }}</strong>
          <span>{{ $t('views.sharedZone.dropFilesOverlayHint') }}</span>
        </div>
      </Transition>
    </el-upload>
  </section>
</template>

<style lang="less" scoped>
.upload-panel {
  min-height: 0;
  flex: 1;
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;

  &.has-file {
    min-height: 80px;
    flex: 0 0 80px;
  }

  .upload-comp {
    min-height: 0;
    flex: 1;
    overflow: hidden;

    :deep(.el-upload) {
      height: 100%;
    }

    :deep(.el-upload-dragger) {
      position: relative;
      height: 100%;
      min-height: 180px;
      padding: 28px 24px;
      overflow: hidden;
      border: 1px dashed
        color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color-light));
      border-radius: var(--bridge-radius-md);
      background:
        radial-gradient(
          circle at 50% 32%,
          color-mix(in srgb, var(--el-color-primary) 9%, transparent) 0,
          transparent 34%
        ),
        var(--bridge-surface);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition:
        border-color var(--bridge-motion),
        background var(--bridge-motion),
        box-shadow var(--bridge-motion);

      &:hover {
        border-color: color-mix(in srgb, var(--el-color-primary) 36%, var(--bridge-stroke));
        background:
          radial-gradient(
            circle at 50% 32%,
            color-mix(in srgb, var(--el-color-primary) 13%, transparent) 0,
            transparent 38%
          ),
          color-mix(in srgb, var(--bridge-surface) 96%, var(--el-color-primary));
        box-shadow: 0 12px 32px color-mix(in srgb, var(--el-color-primary) 9%, transparent);

        .upload-illustration {
          transform: translateY(-2px);
        }

        .choose-file-action {
          background: var(--el-color-primary-dark-2);
          box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 24%, transparent);
        }
      }
    }

    .upload-illustration {
      position: relative;
      width: 112px;
      height: 84px;
      margin-bottom: 18px;
      transition: transform var(--bridge-motion);

      &::before {
        position: absolute;
        left: 50%;
        bottom: 2px;
        width: 86px;
        height: 14px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
        content: '';
        filter: blur(7px);
        transform: translateX(-50%);
      }

      .file-card {
        position: absolute;
        width: 60px;
        height: 68px;
        padding: 12px;
        box-sizing: border-box;
        border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--bridge-stroke));
        border-radius: 13px;
        background: var(--bridge-surface);
        box-shadow: var(--bridge-shadow-sm);
      }

      .file-card-back {
        top: 2px;
        left: 20px;
        opacity: 0.72;
        transform: rotate(-9deg);
      }

      .file-card-front {
        top: 6px;
        right: 17px;
        color: var(--el-color-primary);
        transform: rotate(6deg);

        .el-icon {
          display: block;
          margin-bottom: 10px;
          font-size: 23px;
        }
      }

      .file-lines {
        display: block;
        width: 100%;
        height: 4px;
        border-radius: 2px;
        background: var(--el-border-color-light);
        box-shadow:
          0 9px 0 var(--el-border-color-light),
          0 18px 0 var(--el-border-color-light);
      }

      .add-badge {
        position: absolute;
        right: 5px;
        bottom: 3px;
        width: 28px;
        height: 28px;
        border: 3px solid var(--bridge-surface);
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        background: var(--el-color-primary);
        box-shadow: 0 5px 14px color-mix(in srgb, var(--el-color-primary) 30%, transparent);

        .el-icon {
          font-size: 16px;
          font-weight: 700;
        }
      }
    }

    .upload-copy {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;

      strong {
        color: var(--el-text-color-primary);
        font-size: 16px;
        font-weight: 650;
        line-height: 1.5;
      }

      .upload-hint {
        margin-top: 4px;
        color: var(--el-text-color-secondary);
        font-size: 13px;
        line-height: 1.5;
      }
    }

    .choose-file-action {
      position: relative;
      min-width: 116px;
      min-height: 38px;
      margin-top: 16px;
      padding: 0 17px;
      box-sizing: border-box;
      border-radius: var(--bridge-radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      color: #fff;
      background: var(--el-color-primary);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
      font-size: 13px;
      font-weight: 600;
      line-height: 1;
      transition:
        background var(--bridge-motion),
        box-shadow var(--bridge-motion),
        transform var(--bridge-motion);

      .el-icon {
        font-size: 16px;
      }
    }

    .upload-sub-hint {
      position: relative;
      margin-top: 10px;
      color: var(--el-text-color-placeholder);
      font-size: 11px;
      line-height: 1.5;
    }

    .drop-overlay {
      position: absolute;
      z-index: 2;
      inset: 0;
      border-radius: var(--bridge-radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-primary);
      background:
        radial-gradient(
          circle at 50% 42%,
          color-mix(in srgb, var(--el-color-primary) 18%, transparent),
          transparent 42%
        ),
        color-mix(in srgb, var(--bridge-surface) 72%, transparent);
      backdrop-filter: blur(14px) saturate(135%);
      -webkit-backdrop-filter: blur(14px) saturate(135%);
      pointer-events: none;

      .drop-icon {
        width: 58px;
        height: 58px;
        margin-bottom: 14px;
        border: 1px solid color-mix(in srgb, var(--el-color-primary) 25%, transparent);
        border-radius: 18px;
        display: grid;
        place-items: center;
        color: #fff;
        background: color-mix(in srgb, var(--el-color-primary) 88%, transparent);
        box-shadow: 0 12px 30px color-mix(in srgb, var(--el-color-primary) 28%, transparent);

        .el-icon {
          font-size: 28px;
        }
      }

      strong {
        font-size: 17px;
        font-weight: 650;
        line-height: 1.5;
      }

      > span:last-child {
        margin-top: 4px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.5;
      }
    }
  }

  .file-summary {
    height: 64px;
    margin: 8px;
    padding: 8px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 10px;
    background: var(--bridge-surface);
    box-shadow: inset 0 0 0 1px var(--bridge-stroke);

    .file-icon {
      width: 38px;
      height: 38px;
      flex: none;
      border-radius: 9px;
      display: grid;
      place-items: center;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .file-info {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;

      strong {
        overflow: hidden;
        color: var(--el-text-color-primary);
        font-size: 13px;
        font-weight: 600;
        line-height: 1.35;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-meta {
        min-width: 0;
        margin-top: 3px;
        display: flex;
        align-items: center;
        gap: 8px;

        > span {
          color: var(--el-text-color-secondary);
          font: 11px/1.3 monospace;
        }
      }

      .show-details {
        height: auto;
        min-height: 22px;
        padding: 0 2px;
        font-size: 11px;
        line-height: 1.3;
      }
    }

    .clear-selection {
      width: 44px;
      height: 44px;
      flex: none;
    }
  }
}

.drop-overlay-enter-active,
.drop-overlay-leave-active {
  transition:
    opacity 140ms ease-out,
    transform 140ms ease-out;
}

.drop-overlay-enter-from,
.drop-overlay-leave-to {
  opacity: 0;
  transform: scale(0.985);
}

@media (max-height: 700px) {
  .upload-panel .upload-comp {
    :deep(.el-upload-dragger) {
      padding: 20px;
    }

    .upload-illustration {
      transform: scale(0.88);
      margin-bottom: 10px;
    }

    .choose-file-action {
      margin-top: 12px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .upload-panel .upload-comp {
    :deep(.el-upload-dragger),
    .upload-illustration,
    .choose-file-action,
    .drop-overlay-enter-active,
    .drop-overlay-leave-active {
      transition: none;
    }
  }
}
</style>

<style lang="less">
.el-popper.bridge-file-detail-popover {
  padding: 8px;
  border-color: var(--bridge-stroke);
  border-radius: 12px;
  background: var(--bridge-surface);
  box-shadow: var(--bridge-shadow-md);

  .file-detail-header {
    min-height: 34px;
    padding: 0 6px 7px;
    border-bottom: 1px solid var(--bridge-stroke);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    strong {
      color: var(--el-text-color-primary);
      font-size: 13px;
      font-weight: 650;
    }

    span {
      color: var(--el-text-color-secondary);
      font: 11px/1.3 monospace;
    }
  }

  .file-detail-list {
    padding: 6px 0;
  }

  .file-detail-row {
    min-height: 50px;
    padding: 4px 2px 4px 6px;
    box-sizing: border-box;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 9px;
    transition: background var(--bridge-motion);

    &:hover {
      background: var(--el-fill-color-light);
    }

    .file-detail-icon {
      width: 30px;
      height: 30px;
      flex: none;
      border-radius: 8px;
      display: grid;
      place-items: center;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .file-detail-copy {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;

      strong {
        min-width: 0;
        overflow: hidden;
        color: var(--el-text-color-primary);
        font-size: 12px;
        font-weight: 500;
        line-height: 1.4;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      span {
        margin-top: 1px;
        color: var(--el-text-color-secondary);
        font: 10px/1.3 monospace;
      }
    }

    .remove-file {
      width: 40px;
      height: 40px;
      flex: none;
    }
  }
}
</style>

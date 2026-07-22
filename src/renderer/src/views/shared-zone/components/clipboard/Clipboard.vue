<script setup lang="ts">
import { CopyDocument, Delete } from '@element-plus/icons-vue'
import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'
import { ElMessage, ElMessageBox } from 'element-plus'
import { toRaw } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const clips = useRemoteRef<ClipboardContent[]>('clipboard-history', [])

const isText = (c: ClipboardContent) => c.mime.startsWith('text/')
const isImage = (c: ClipboardContent) => c.mime.startsWith('image/')

function toClipboardUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  return `clipboard:///${encodeURI(normalized)}`
}

async function handleClearHistory() {
  await ElMessageBox({
    type: 'warning',
    title: t('common.warning'),
    message: t('views.sharedZone.confirmClearClipboard'),
    showCancelButton: true,
  })
  clips.value = []
}

async function handleCopy(content: ClipboardContent) {
  try {
    // 复制
    await window.ipc.share.writeContent(toRaw(content))
    ElMessage({
      message: t('views.sharedZone.copySuccess'),
      type: 'success',
      plain: true,
    })
  } catch (e) {
    console.error(e)
    ElMessage({
      message: t('views.sharedZone.copyFailed'),
      type: 'error',
      plain: true,
    })
  }
}
</script>

<template>
  <section class="activity-panel clipboard-panel">
    <header class="panel-header">
      <div class="title">
        <span>{{ $t('views.sharedZone.sharedClipboard') }}</span>
        <span v-if="clips.length" class="count">
          {{ clips.length }}
        </span>
      </div>
      <div class="panel-actions">
        <el-button
          circle
          text
          :icon="Delete"
          :disabled="!clips.length"
          :title="$t('views.sharedZone.clearHistory')"
          :aria-label="$t('views.sharedZone.clearHistory')"
          @click="handleClearHistory"
        />
      </div>
    </header>

    <div class="panel-body">
      <el-scrollbar v-if="clips.length" class="clipboard">
        <div class="clipboard-list">
          <article v-for="(c, i) in clips" :key="c.v ?? i" class="clip">
            <div class="clip-content">
              <p v-if="isText(c)" :title="c.text">
                {{ c.text }}
              </p>

              <img
                v-else-if="isImage(c)"
                :src="toClipboardUrl(c.path!)"
                class="clip-image"
                draggable="false"
              />

              <div v-else class="clip-unknown">
                {{ c.mime }}
              </div>
            </div>

            <div class="clip-footer">
              <span class="device">{{ c.device.name }}</span>

              <el-button type="primary" link size="small" @click="handleCopy(c)">
                {{ $t('views.sharedZone.copy') }}
              </el-button>
            </div>
          </article>
        </div>
      </el-scrollbar>

      <div v-else class="clipboard-empty">
        <span class="empty-icon"
          ><el-icon><CopyDocument /></el-icon
        ></span>
        <span>{{ $t('views.sharedZone.emptyClipboard') }}</span>
      </div>
    </div>
  </section>
</template>

<style lang="less" scoped>
.activity-panel {
  min-height: 0;
  border-radius: var(--bridge-radius-md);
  background: var(--bridge-surface-soft);
  box-shadow: inset 0 0 0 1px var(--bridge-stroke);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    min-height: 46px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    padding: 0 10px 0 16px;

    .title {
      font-size: 14px;
      font-weight: 600;
      display: flex;
      gap: 6px;
      align-items: center;

      .count {
        font-family: monospace;
        font-size: 11px;
        color: var(--el-text-color-placeholder);
      }
    }

    .panel-actions {
      display: flex;
      align-items: center;
      gap: 2px;
    }
  }

  .panel-body {
    min-height: 0;
    flex: 1;
    overflow: hidden;
    padding: 0 6px 6px;
    background: transparent;

    .clipboard-empty {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--el-text-color-placeholder);

      .empty-icon {
        width: 36px;
        height: 36px;
        border-radius: 11px;
        display: grid;
        place-items: center;
        color: var(--el-text-color-secondary);
        background: var(--bridge-surface-soft);
      }
    }

    .clipboard {
      height: 100%;

      :deep(.el-scrollbar__view) {
        min-height: 100%;
      }

      .clipboard-list {
        padding: 2px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .clip {
        min-height: 104px;
        background: color-mix(in srgb, var(--bridge-surface) 74%, transparent);
        border: 0;
        border-radius: 9px;
        box-shadow: inset 0 0 0 1px var(--bridge-stroke);
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .clip-content {
        flex: 1;
        overflow: hidden;
        display: flex;
        justify-content: center;

        p {
          margin: 0;
          height: fit-content;
          width: 100%;
          font-size: 14px;
          color: var(--el-text-color-regular);
          word-break: break-all;
          display: -webkit-box;
          line-clamp: 3;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          overflow: hidden;
        }

        .clip-image {
          max-width: 100%;
          max-height: 150px;
          object-fit: contain;
          border-radius: 6px;
          background: var(--el-fill-color-light);
        }

        .clip-unknown {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .clip-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .device {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}

@media (max-width: 760px) {
  .activity-panel .panel-header {
    padding-left: 12px;

    .title {
      font-size: 13px;
    }
  }
}
</style>

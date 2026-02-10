<script setup lang="ts">
import { CaretBottom, CaretTop } from '@element-plus/icons-vue'
import { useRemoteRef } from '@renderer/composables/remote-ref/useRemoteRef'
import { useCollapse } from '@renderer/composables/share-zone/useCollapse'

const clips = useRemoteRef<ClipboardContent[]>('clipboard-history', [])

const { clipboardActive } = useCollapse()

const isText = (c: ClipboardContent) => c.mime.startsWith('text/')
const isImage = (c: ClipboardContent) => c.mime.startsWith('image/')

function toClipboardUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  return `clipboard:///${encodeURI(normalized)}`
}

function handleClearHistory() {
  clips.value = []
}
</script>

<template>
  <div class="footer">
    <div class="footer-header" :class="{ border: clipboardActive }">
      <div class="title">{{ $t('views.sharedZone.sharedClipboard') }}</div>
      <div>
        <el-button link size="small" @click="handleClearHistory">
          {{ $t('views.sharedZone.clearHistory') }}
        </el-button>
        <el-button
          size="small"
          circle
          plain
          :icon="clipboardActive ? CaretBottom : CaretTop"
          @click="clipboardActive = !clipboardActive"
        >
        </el-button>
      </div>
    </div>

    <div class="clipboard-wrapper" :class="{ active: clipboardActive }">
      <el-scrollbar v-if="clips.length" class="clipboard">
        <div class="clipboard-list">
          <div v-for="(c, i) in clips" :key="c.v ?? i" class="clip">
            <!-- 内容区域 -->
            <div class="clip-content">
              <!-- 文本 -->
              <p v-if="isText(c)" :title="c.text">
                {{ c.text }}
              </p>

              <!-- 图片 -->
              <img
                v-else-if="isImage(c)"
                :src="toClipboardUrl(c.path!)"
                class="clip-image"
                draggable="false"
              />

              <!-- 兜底 -->
              <div v-else class="clip-unknown">
                {{ c.mime }}
              </div>
            </div>

            <!-- 底部 -->
            <div class="clip-footer">
              <span class="device">{{ c.device.name }}</span>

              <el-button type="primary" link size="small">
                {{ $t('views.sharedZone.copy') }}
              </el-button>
            </div>
          </div>
        </div>
      </el-scrollbar>

      <div v-else class="clipboard-empty">
        {{ $t('views.sharedZone.emptyClipboard') }}
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.footer {
  border-top: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);

  .footer-header {
    height: 47px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--el-bg-color);
    padding: 10px 16px;

    &.border {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .title {
      font-size: 14px;
      font-weight: 600;
    }
  }

  .clipboard-wrapper {
    height: 0px;
    overflow: hidden;
    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.active {
      height: 160px;
    }

    .clipboard-empty {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 14px;
      color: var(--el-text-color-placeholder);
    }

    .clipboard {
      height: 100%;

      :deep(.el-scrollbar__view) {
        height: 100%;
        display: flex;
      }

      .clipboard-list {
        padding: 10px 16px;
        padding-bottom: 16px;
        display: flex;
        gap: 10px;
      }

      .clip {
        width: 260px;
        min-width: 260px;
        height: 100%;
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-light);
        border-radius: 12px;
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
          max-height: 100%;
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
</style>

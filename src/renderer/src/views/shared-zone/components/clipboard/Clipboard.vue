<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const clips = ref<any[]>([])

function copy(text: string) {
  navigator.clipboard.writeText(text)
  ElMessage.success(t('views.sharedZone.copySuccess'))
}
</script>

<template>
  <el-footer class="footer">
    <div class="footer-header">
      <div class="title">{{ $t('views.sharedZone.sharedClipboard') }}</div>
      <el-button link size="small">{{ $t('views.sharedZone.clearHistory') }}</el-button>
    </div>
    <el-scrollbar v-if="clips.length" class="clipboard">
      <div class="clipboard-list">
        <div v-for="(c, i) in clips" :key="i" class="clip">
          <p :title="c.text">{{ c.text }}</p>
          <div class="clip-footer">
            <span>{{ c.from }}</span>
            <el-button type="primary" link size="small" @click="copy(c.text)">
              {{ $t('views.sharedZone.copy') }}
            </el-button>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <div v-else class="clipboard-empty">{{ $t('views.sharedZone.emptyClipboard') }}</div>
  </el-footer>
</template>

<style lang="less" scoped>
.footer {
  border-top: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  padding: 16px;
  height: 180px;
  display: flex;
  flex-direction: column;

  .footer-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;

    .title {
      font-size: 14px;
      font-weight: 600;
    }
  }

  .clipboard-empty {
    flex: 1;
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--el-text-color-placeholder);
  }

  .clipboard {
    flex: 1;
    overflow: hidden;

    :deep(.el-scrollbar__view) {
      height: 100%;
    }

    .clipboard-list {
      display: flex;
      gap: 12px;
      height: 100%;
      width: fit-content;

      .clip {
        height: calc(100% - 26px);
        width: 260px;
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-light);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        p {
          font-size: 14px;
          color: var(--el-text-color-regular);
          margin-bottom: 8px;
          word-break: break-all;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          line-clamp: 3;
          -webkit-line-clamp: 3; /* 超出几行省略 */
          overflow: hidden;
        }

        .clip-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
}
</style>

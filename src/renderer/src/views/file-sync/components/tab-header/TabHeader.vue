<script setup lang="ts">
import { ref, nextTick, computed, h } from 'vue'
import type { SyncSession, SyncSessionState } from '@renderer/composables/file-sync/useSyncSession'
import { Close, Plus } from '@element-plus/icons-vue'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { ElIcon, ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import ContextMenu from '@imengyu/vue3-context-menu'
import { useTheme } from '@renderer/composables/setting/useTheme'

const { currentTheme } = useTheme()
const { t } = useI18n()
const tabNameRef = ref<HTMLElement[]>([])

const { sessions, activeSessionId, activeSessionState, createSyncSession, closeSyncSession } =
  useActiveSyncSession()

// 编辑相关状态
const editingSessionId = ref<string | null>(null)
const tempName = ref('')
const editInputRef = ref<HTMLInputElement[]>([])

// 处理标签点击
const handleTabClick = (sessionId: string) => {
  activeSessionId.value = sessionId
}

// 处理标签双击
const handleTabDoubleClick = (session: SyncSessionState) => {
  if (session.sessionId === activeSessionId.value) {
    editingSessionId.value = session.sessionId
    tempName.value = session.name
    nextTick(() => {
      editInputRef.value[0]?.focus()
      editInputRef.value[0]?.select()
    })
  }
}

// 确认编辑
const confirmEdit = () => {
  if (editingSessionId.value) {
    const newName = tempName.value.trim()

    if (newName) {
      const session = sessions.value.find(
        (s) => s.sessionState.sessionId === editingSessionId.value,
      )
      if (!session) return
      session.sessionState.name = newName
    } else {
      // 名称为空，回退到原名称
      cancelEdit()
    }

    editingSessionId.value = null
    tempName.value = ''
  }
}

// 取消编辑
const cancelEdit = () => {
  editingSessionId.value = null
  tempName.value = ''
}

// 处理关闭标签
const handleCloseTab = (sessionId: string, index: number) => {
  closeSyncSession(sessionId, index)
}

// 新增标签
const handleAddTab = () => {
  if (tabNameRef.value[0].clientWidth < 20) {
    ElMessage.error(t('views.fileSync.tabsFull'))
    return
  }
  createSyncSession()
}

// 右键标签
const handleContextmenu = (e: MouseEvent, session: SyncSession, index: number) => {
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y + 15,
    theme: currentTheme.value,
    items: [
      {
        label: t('common.close'),
        icon: h(ElIcon, { size: 14 }, { default: () => h(Close) }),
        onClick: () => {
          handleCloseTab(session.sessionState.sessionId, index)
        },
      },
    ],
  })
}

// 边框颜色
const borderColor = computed(() => {
  if (activeSessionState.value.isSyncing) {
    return 'var(--el-color-success)'
  } else if (activeSessionState.value.isComparing) {
    return 'var(--el-color-primary)'
  } else {
    return 'var(--el-border-color)'
  }
})
</script>

<template>
  <div class="sync-session-tabs">
    <div class="tabs-container">
      <!-- 标签页列表 -->
      <div
        v-for="(session, index) in sessions"
        :key="session.sessionState.sessionId"
        :class="[
          'tab-item',
          {
            active: session.sessionState.sessionId === activeSessionId,
            comparing: session.sessionState.isComparing,
            syncing: session.sessionState.isSyncing,
          },
        ]"
        :title="session.sessionState.name"
        @click="handleTabClick(session.sessionState.sessionId)"
        @contextmenu="handleContextmenu($event, session, index)"
      >
        <!-- 编辑状态 -->
        <div v-if="editingSessionId === session.sessionState.sessionId" class="tab-edit">
          <input
            ref="editInputRef"
            v-model="tempName"
            type="text"
            class="tab-edit-input"
            @blur="confirmEdit"
            @keyup.enter="confirmEdit"
            @keyup.esc="cancelEdit"
          />
        </div>

        <!-- 正常显示状态 -->
        <div v-else class="tab-content">
          <!-- 状态指示器 -->
          <div class="status-indicator">
            <div v-if="session.sessionState.isComparing" class="comparing-indicator"></div>
            <div v-else-if="session.sessionState.isSyncing" class="syncing-indicator"></div>
            <div v-else class="idle-indicator"></div>
          </div>

          <!-- 标签名称 -->
          <span
            ref="tabNameRef"
            class="tab-name"
            @dblclick="handleTabDoubleClick(session.sessionState)"
            >{{ session.sessionState.name }}</span
          >

          <!-- 关闭按钮 -->
          <div
            class="close-btn"
            @click.stop="handleCloseTab(session.sessionState.sessionId, index)"
          >
            <el-icon><Close /></el-icon>
          </div>
        </div>
      </div>

      <!-- 新建标签按钮 -->
      <div class="add-tab" @click="handleAddTab">
        <el-icon><Plus /></el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

.sync-session-tabs {
  background: var(--el-bg-color);
  padding: 0 12px;
  user-select: none;
  border-bottom: 1px solid v-bind(borderColor);

  .tabs-container {
    display: flex;
    align-items: end;
    gap: 4px;
    width: 100%;
    height: 40px;

    .tab-item {
      flex: 1;
      overflow: hidden;
      height: 34px;
      max-width: 120px;
      padding: 0 12px;
      position: relative;
      display: flex;
      align-items: center;
      background: var(--el-fill-color);
      border: 1px solid var(--el-border-color);
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      cursor: pointer;
      transition: border 0.2s;

      &.active {
        background: var(--el-bg-color);
        // border-color: var(--el-color-primary);
        z-index: 1;
        padding-bottom: 1px;
        margin-bottom: -1px;
      }

      &.comparing {
        border-color: var(--el-color-primary);
      }

      &.syncing {
        border-color: var(--el-color-success);
      }

      .tab-edit {
        flex: 1;
        overflow: hidden;

        .tab-edit-input {
          width: 100%;
          height: 24px;
          border: none;
          border-bottom: 1px solid var(--el-color-primary);
          padding: 0 6px;
          font-size: 12px;
          background: var(--el-bg-color);
          color: var(--el-text-color-primary);
          outline: none;
        }
      }

      .tab-content {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        height: 100%;

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;

          .comparing-indicator {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: var(--el-color-primary);
            animation: pulse 1.5s infinite;
          }

          .syncing-indicator {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: var(--el-color-success);
            animation: pulse 1s infinite;
          }

          .idle-indicator {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: var(--el-text-color-placeholder);
          }
        }

        .tab-name {
          flex: 1;
          font-size: 13px;
          color: var(--el-text-color-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .close-btn {
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          color: var(--el-text-color-secondary);
          transition: all 0.2s;
          flex-shrink: 0;

          &:hover {
            background: var(--el-color-danger-light-7);
            color: var(--el-color-danger);
          }
        }
      } // .tab-content
    } // .tab-item
  } // .tabs-container

  .add-tab {
    margin-bottom: 4px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px dashed var(--el-border-color-light);
    border-radius: 50%;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }
}
</style>

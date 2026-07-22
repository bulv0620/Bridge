<script setup lang="ts">
import { computed, ref, nextTick, h } from 'vue'
import { Close, Plus } from '@element-plus/icons-vue'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import { ElIcon } from 'element-plus'
import { useI18n } from 'vue-i18n'
import ContextMenu from '@imengyu/vue3-context-menu'
import { useTheme } from '@renderer/composables/setting/useTheme'

defineProps<{ titlebar?: boolean }>()

const { currentTheme } = useTheme()
const { t } = useI18n()
const tabsScrollRef = ref<HTMLElement | null>(null)

const {
  sessions,
  activeSessionId,
  canCreateSyncSession,
  isCreatingSession,
  createSyncSession,
  closeSyncSession,
} = useActiveSyncSession()
const isAddTabDisabled = computed(() => !canCreateSyncSession.value || isCreatingSession.value)

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
const handleAddTab = async () => {
  const created = await createSyncSession()
  if (!created) return

  await nextTick()
  tabsScrollRef.value?.scrollTo({
    left: tabsScrollRef.value.scrollWidth,
    behavior: 'smooth',
  })
}

const handleTabsWheel = (event: WheelEvent) => {
  const el = tabsScrollRef.value
  if (!el || el.scrollWidth <= el.clientWidth) return

  event.preventDefault()
  el.scrollLeft += Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
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
</script>

<template>
  <div class="sync-session-tabs" :class="{ 'is-titlebar': titlebar }">
    <div class="tabs-container">
      <div ref="tabsScrollRef" class="tabs-scroll" role="tablist" @wheel="handleTabsWheel">
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
          role="tab"
          tabindex="0"
          :aria-selected="session.sessionState.sessionId === activeSessionId"
          @click="handleTabClick(session.sessionState.sessionId)"
          @keydown.enter="handleTabClick(session.sessionState.sessionId)"
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
            <span class="tab-name" @dblclick="handleTabDoubleClick(session.sessionState)">
              {{ session.sessionState.name }}
            </span>

            <!-- 关闭按钮 -->
            <div
              class="close-btn"
              role="button"
              tabindex="0"
              :aria-label="$t('common.close')"
              @click.stop="handleCloseTab(session.sessionState.sessionId, index)"
              @keydown.enter.stop="handleCloseTab(session.sessionState.sessionId, index)"
            >
              <el-icon><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 新建标签按钮 -->
      <el-button
        circle
        text
        class="add-tab"
        :icon="Plus"
        :disabled="isAddTabDisabled"
        :title="
          canCreateSyncSession ? $t('views.fileSync.newSession') : $t('views.fileSync.sessionsFull')
        "
        :aria-label="
          canCreateSyncSession ? $t('views.fileSync.newSession') : $t('views.fileSync.sessionsFull')
        "
        @click="handleAddTab"
      />
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
  min-width: 0;
  overflow: hidden;
  background: var(--bridge-surface);
  padding: var(--bridge-page-padding) var(--bridge-page-padding) 2px;
  user-select: none;

  &.is-titlebar {
    height: 100%;
    padding: 0;
    background: transparent;
    -webkit-app-region: drag;

    .tabs-container {
      height: 100%;
      min-height: 0;
      align-items: flex-end;

      .tabs-scroll {
        height: 100%;
        align-items: flex-end;
      }

      .tab-item {
        height: 30px;
        margin-bottom: 4px;
        -webkit-app-region: no-drag;

        &.active {
          height: 34px;
          margin-bottom: 0;
          overflow: visible;
          border-radius: 10px 10px 0 0;
          background: var(--bridge-surface);
          box-shadow: none;
          z-index: 2;

          &::before,
          &::after {
            content: '';
            width: 8px;
            height: 8px;
            position: absolute;
            bottom: 0;
            pointer-events: none;
          }

          &::before {
            left: -8px;
            border-bottom-right-radius: 8px;
            box-shadow: 4px 4px 0 4px var(--bridge-surface);
          }

          &::after {
            right: -8px;
            border-bottom-left-radius: 8px;
            box-shadow: -4px 4px 0 4px var(--bridge-surface);
          }

          .tab-content,
          .tab-edit {
            min-width: 0;
            overflow: hidden;
          }
        }
      }
    }

    .add-tab {
      width: 30px;
      height: 30px;
      margin-bottom: 4px;
      -webkit-app-region: no-drag;
    }
  }

  .tabs-container {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-width: 0;
    min-height: 38px;
    overflow: hidden;

    .tabs-scroll {
      min-width: 0;
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .tab-item {
      width: 148px;
      flex: 0 0 148px;
      overflow: hidden;
      height: 36px;
      padding: 0 12px;
      position: relative;
      display: flex;
      align-items: center;
      background: transparent;
      border: 0;
      border-radius: 9px;
      cursor: pointer;
      transition:
        color var(--bridge-motion),
        background var(--bridge-motion),
        box-shadow var(--bridge-motion);

      &:hover {
        background: var(--bridge-surface-soft);
      }

      &.active {
        background: var(--bridge-surface-soft);
        z-index: 1;
        box-shadow: inset 0 0 0 1px var(--bridge-stroke);
      }

      &.comparing {
        background: var(--el-color-primary-light-9);
      }

      &.syncing {
        background: var(--el-color-success-light-9);
      }

      .tab-edit {
        flex: 1;
        overflow: hidden;

        .tab-edit-input {
          width: 100%;
          height: 24px;
          border: none;
          border: 0;
          border-radius: 5px;
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
          transition:
            color var(--bridge-motion),
            background var(--bridge-motion);
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
    width: 30px;
    height: 30px;
    min-width: 30px;
    min-height: 30px;
    margin: 0;
    border-radius: 8px;
    color: var(--el-text-color-secondary);
    transition:
      color var(--bridge-motion),
      background var(--bridge-motion);
    flex-shrink: 0;

    &:hover:not(.is-disabled) {
      color: var(--el-text-color-primary);
      background: color-mix(in srgb, var(--bridge-surface) 74%, transparent);
    }

    &.is-disabled {
      opacity: 0.5;
    }
  }
}
</style>

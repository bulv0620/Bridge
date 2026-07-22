<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useActiveSyncSession } from '@renderer/composables/file-sync/useActiveSyncSession'
import Sider from './components/Sider.vue'
import Header from './components/Header.vue'

const route = useRoute()
const { sessions, activeSessionId } = useActiveSyncSession()
const isLeftmostSessionActive = computed(
  () => route.path === '/' && sessions.value[0]?.sessionState.sessionId === activeSessionId.value,
)
</script>

<template>
  <div class="window-shell">
    <Header />

    <el-container class="app-shell">
      <el-aside width="auto">
        <Sider />
      </el-aside>

      <el-container
        class="workspace-frame"
        :class="{ 'is-leftmost-session-active': isLeftmostSessionActive }"
      >
        <el-main class="workspace-content">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped lang="less">
.window-shell {
  width: 100%;
  height: 100dvh;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bridge-app-bg);
}

.app-shell {
  width: 100%;
  min-height: 0;
  flex: 1;
  min-width: 0;
  padding: 0 10px 10px;
  gap: 10px;
  background: var(--bridge-app-bg);
}

.workspace-frame {
  min-width: 0;
  overflow: hidden;
  border-radius: var(--bridge-radius-lg);
  background: var(--bridge-surface);
  transition: border-radius var(--bridge-motion);

  &.is-leftmost-session-active {
    border-top-left-radius: 0;
  }
}

.workspace-content {
  min-width: 0;
  padding: 0;
  overflow: hidden;
}

@media (max-width: 760px) {
  .app-shell {
    padding: 0 8px 8px;
    gap: 8px;
  }
}
</style>

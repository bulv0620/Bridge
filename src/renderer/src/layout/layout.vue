<script setup lang="ts">
import Sider from './components/Sider.vue'
import Header from './components/Header.vue'
</script>

<template>
  <div class="window-shell">
    <Header />

    <el-container class="app-shell">
      <el-aside width="auto">
        <Sider />
      </el-aside>

      <el-container class="workspace-frame">
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
  box-shadow:
    var(--bridge-shadow-sm),
    inset 0 0 0 1px var(--bridge-stroke);
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

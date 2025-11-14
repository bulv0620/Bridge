<script setup lang="ts">
import Sider from './components/Sider.vue'
</script>

<template>
  <el-container style="height: 100vh; width: 100%">
    <el-aside width="auto">
      <Sider />
    </el-aside>

    <el-container>
      <el-main style="padding: 0; overflow: hidden">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped></style>

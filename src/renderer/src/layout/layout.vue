<script setup lang="ts">
import Sider from './components/Sider.vue'
</script>

<template>
  <n-layout class="layout" style="height: 100vh; width: 100%">
    <n-layout has-sider style="height: 100vh; overflow: hidden">
      <Sider></Sider>
      <n-layout :native-scrollbar="false">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </n-layout>
    </n-layout>
  </n-layout>
</template>

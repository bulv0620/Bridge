<script setup lang="ts">
import Header from './components/Header.vue'
import Sider from './components/Sider.vue'
</script>

<template>
  <n-layout class="layout" style="height: 100vh; width: 100%">
    <div class="layout__header">
      <Header />
    </div>
    <n-layout has-sider style="height: calc(100vh - 33px)">
      <Sider></Sider>
      <n-layout :native-scrollbar="false">
        <router-view></router-view>
      </n-layout>
    </n-layout>
  </n-layout>
</template>

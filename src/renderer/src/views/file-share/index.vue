<script setup lang="ts">
import { computed, ref } from 'vue'
import { Settings, LogoTux, LogoMicrosoft, LogoApple } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

defineOptions({
  name: 'FileShare',
})

const message = useMessage()

const loading = ref(false)
const columns = computed(() => [
  {
    title: 'File Name',
    key: 'fileName',
  },
  {
    title: 'File Size',
    key: 'fileSize',
  },
  {
    title: 'Last Modified',
    key: 'lastModified',
  },
])
const fileList = ref([])

const options = [
  {
    label: 'desktop1',
    key: 'desktop1',
  },
  {
    label: 'desktop2',
    key: 'desktop2',
  },
  {
    label: 'desktop3',
    key: 'desktop3',
  },
]

const handleSelect = (key: string | number) => {
  message.info(String(key))
}
</script>

<template>
  <div class="file-share">
    <div class="container">
      <!-- 顶部 -->
      <n-flex justify="space-between">
        <n-dropdown trigger="hover" :options="options" @select="handleSelect">
          <div class="title">
            <n-icon><LogoTux></LogoTux></n-icon>
            <!-- <n-icon><LogoMicrosoft></LogoMicrosoft></n-icon> -->
            <!-- <n-icon><LogoApple></LogoApple></n-icon> -->
            <p class="device-name">JT-XX-342</p>
            <n-text class="device-ip" depth="3"> 192.168.1.1 </n-text>
          </div>
        </n-dropdown>

        <n-flex>
          <n-popover trigger="hover" placement="bottom" :delay="500">
            <template #trigger>
              <n-button circle>
                <template #icon>
                  <n-icon> <Settings /> </n-icon>
                </template>
              </n-button>
            </template>
            <span>{{ '设置共享目录' }}</span>
          </n-popover>
        </n-flex>
      </n-flex>

      <!-- 导航 -->
      <n-breadcrumb>
        <n-breadcrumb-item> Global </n-breadcrumb-item>
        <n-breadcrumb-item> Sub </n-breadcrumb-item>
        <n-breadcrumb-item> Subsub </n-breadcrumb-item>
      </n-breadcrumb>

      <!-- 表格 -->
      <div class="table-wrapper">
        <n-data-table
          ref="tableRef"
          :loading="loading"
          size="small"
          virtual-scroll
          :columns="columns"
          :data="fileList"
          flex-height
          style="height: 100%"
        />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.file-share {
  padding: 18px;
  height: calc(100vh - 69px);

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .title {
      height: 100%;
      display: flex;
      gap: 8px;
      align-items: center;
      cursor: pointer;
      user-select: none;

      .device-name {
        font-size: large;
        font-weight: 500;
      }

      .device-ip {
        font-size: small;
        font-weight: 400;
        user-select: text;
      }
    }

    .table-wrapper {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>

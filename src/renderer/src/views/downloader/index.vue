<script setup lang="ts">
import { Aria2Client } from '@renderer/utils/aria2-request'

async function getOptions() {
  const client = new Aria2Client({ url: 'http://localhost:6800/jsonrpc', token: 'bulv' })
  const res = await client.getGlobalOption()
  console.log(res)
}

const columns = [
  {
    title: '文件名',
    key: '文件名',
  },
  {
    title: '大小',
    key: '大小',
  },
  {
    title: '进度',
    key: '进度',
  },
  {
    title: '剩余时间',
    key: '剩余时间',
  },
  {
    title: '下载速度',
    key: '下载速度',
  },
]

const data = []
</script>

<template>
  <div class="downloader">
    <div class="header">
      <n-button size="small">新建任务</n-button>
      <n-button size="small">开始</n-button>
      <n-button size="small">暂停</n-button>
      <n-button size="small">删除</n-button>
      <n-button size="small" style="margin-left: auto">设置</n-button>
    </div>
    <n-divider style="margin: 0"></n-divider>
    <div class="main">
      <div class="tabs">
        <n-tag>全部</n-tag>
        <n-tag>正在下载</n-tag>
        <n-tag>等待</n-tag>
        <n-tag>已完成</n-tag>
        <n-button size="small" style="margin-left: auto">刷新</n-button>
      </div>

      <div class="table">
        <n-data-table
          size="small"
          :columns="columns"
          :data="data"
          virtual-scroll
          flex-height
          style="height: 100%"
        />
      </div>
    </div>
    <n-divider style="margin: 0"></n-divider>
    <div class="footer">上传: 100KB 下载: 100KB</div>
  </div>
</template>

<style lang="less" scoped>
.downloader {
  width: 100%;
  height: calc(100vh - 33px);
  display: flex;
  flex-direction: column;

  .header {
    padding: 16px;
    display: flex;
    gap: 8px;
  }

  .main {
    flex: 1;
    overflow: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .tabs {
      display: flex;
      gap: 8px;
    }

    .table {
      flex: 1;
      overflow: hidden;
    }
  }

  .footer {
    padding: 16px;
    display: flex;
    gap: 8px;
  }
}
</style>

# 🛰️ Bridge

> ⚡ 一款基于 **Electron + Vite + Vue3** 构建的跨平台文件同步工具。

**Bridge** —— 让文件备份、共享与下载，如呼吸般自然流畅。

[English](./README.md) | 简体中文

## ✨ 功能特性

### 📁 **文件比对与同步**

选定源目录与目标目录后，自动生成差异文件树并执行同步。

提供三种灵活的同步策略：

- **镜像同步**：目标目录完全复制源目录结构
- **增量同步**：覆盖相同文件、复制新增文件、保留目标端旧文件
- **双向同步**：双向复制更新，冲突文件默认忽略

### 🌐 **局域网文件共享**

基于 UDP 广播自动发现同一网络下的设备。

安全共享本地文件——接收方通过专属文件 ID 经由内置 HTTP 服务下载，无需暴露真实文件路径。

### ⬇️ **一体化下载管理**

内置 **Aria2** 下载引擎，全面支持 HTTP、FTP、BitTorrent 等多种协议。

统一管理互联网下载与局域网共享传输任务，操作直观清晰。



## 📦 技术栈

- **前端：** Vue 3 + Vite + TypeScript
- **后端 / 运行时：** Electron + Node.js
- **网络通信：** UDP 广播发现 + HTTP 文件传输
- **下载模块：** Aria2 RPC 集成



## 🚀 快速开始

### 兼容平台

Bridge 为以下平台提供支持：

- **macOS**: `x86_64` (Intel) 与 `arm64` (Apple Silicon)
- **Linux**: `x86_64` / `amd64` 与 `aarch64` (ARM 64-bit)
- **Windows**: `x86_64` (64-bit)

### 下载与安装

1. **直接下载**：

   - 前往[Releases](https://github.com/bulv0620/Bridge/releases)页面
   - 下载对应您操作系统的最新版本安装包
   - 运行安装程序并按照提示完成安装

2. **从源码构建**（适合开发者）：

   ```bash
   # 克隆仓库
   git clone https://github.com/bulv0620/Bridge.git
   
   # 进入目录
   cd bridge
   
   # 安装依赖
   npm install
   
   # 启动开发模式
   npm run dev
   
   # 构建生产版本
   npm run build:[your-system]
   ```

   
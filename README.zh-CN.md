# 🛰️ Bridge

> ⚡ 一款基于 **Electron** 构建的跨平台文件同步工具。

**Bridge** —— 让文件同步、共享，如呼吸般自然流畅。

[English](./README.md) | 简体中文

## ✨ 功能特性

### 📁 文件比对与同步

选定源目录与目标目录后，自动生成差异文件树并执行同步。

提供三种灵活的同步策略：

- **镜像同步**：目标目录完全复制源目录结构
- **增量同步**：覆盖相同文件、复制新增文件、保留目标端旧文件
- **双向同步**：双向复制更新，冲突文件默认忽略

### 🌐 局域网共享

自动发现同一网络下允许发现的设备。

选择需要传输的文件后点击在线设备，等待接收方确认接收后，即可发送文件。

当然还有One More Thing，开启剪切板共享，你将与局域网中设备共享剪切板

> 剪切板共享当前支持图片和文本的共享



## 📦 技术栈

- **前端：** Vue 3 + Vite + TypeScript
- **后端 / 运行时：** Electron + Node.js
- **网络通信：** UDP 广播发现 + HTTP 文件传输



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

   
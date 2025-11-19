# 🛰️ Bridge

> ⚡ A cross-platform file synchronization tool built with **Electron + Vite + Vue3**.

**Bridge** — Making file backup, sharing, and downloading as intuitive and effortless as breathing.

English | [简体中文](./README.zh-CN.md)

## ✨ Features

### 📁 **File Comparison & Synchronization**

Automatically generates a differential file tree and performs synchronization after selecting source and target directories.

Offers three flexible synchronization strategies:

- **Mirror Sync**: Target directory becomes an exact replica of the source directory structure.
- **Incremental Sync**: Overwrites identical files, copies new files, and retains old files existing only in the target directory.
- **Bidirectional Sync**: Copies newer files in both directions; conflicting files are ignored by default.

### 🌐 **LAN File Sharing**

Automatically discovers devices on the same network via UDP broadcast.

Securely share local files—receivers download using a unique file ID through the built-in HTTP service, without exposing the actual file path.

### ⬇️ **Integrated Download Management**

Built-in **Aria2** download engine with comprehensive support for HTTP, FTP, BitTorrent, and other protocols.

Unified management for both internet downloads and LAN shared transfers, with an intuitive and clear interface.



## 📦 Tech Stack
- **Frontend:** Vue 3 + Vite + TypeScript
- **Backend / Runtime:** Electron + Node.js
- **Network:** UDP broadcast discovery + HTTP transfer
- **Downloader:** Aria2 RPC integration



## 🚀 Quick Start

### Supported Platforms

Bridge supports the following platforms:

- **macOS**: `x86_64` (Intel) and `arm64` (Apple Silicon)
- **Linux**: `x86_64` / `amd64` and `aarch64` (ARM 64-bit)
- **Windows**: `x86_64` (64-bit)

### Download & Install

1. **Direct Download**:

   - Go to the [Releases](https://github.com/bulv0620/Bridge/releases) page.
   - Download the latest installer for your operating system.
   - Run the installer and follow the setup instructions.

2. **Build from Source** (For Developers):

   ```bash
   # Clone the repository
   git clone https://github.com/bulv0620/Bridge.git
   
   # Navigate into the directory
   cd bridge
   
   # Install dependencies
   npm install
   
   # Start development mode
   npm run dev
   
   # Build for production
   npm run build:[your-system]
   ```

   


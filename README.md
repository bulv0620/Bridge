# 🛰️ Bridge

> ⚡ A cross-platform file synchronization tool built with **Electron**.

**Bridge** — making file syncing and sharing as natural and smooth as breathing.

English | [简体中文](./README.zh-CN.md)

## ✨ Features

### 📁 File Comparison & Synchronization

Automatically generates a differential file tree and performs synchronization after selecting source and target directories.

Offers three flexible synchronization strategies:

- **Mirror Sync**: Target directory becomes an exact replica of the source directory structure.
- **Incremental Sync**: Overwrites identical files, copies new files, and retains old files existing only in the target directory.
- **Two-way Sync**: Copies newer files in both directions; conflicting files are ignored by default.

### 🌐 LAN Sharing

Automatically discovers allowed devices on the same network.

Choose or drop a batch of files, then select an online device. The recipient confirms the batch once,
and Bridge transfers each file without overwriting an existing file in the download directory.

And there's One More Thing: Enable clipboard sharing, and you'll share your clipboard with devices on the local network.

> Clipboard sharing currently supports sharing images and text.



## 📦 Tech Stack
- **Frontend:** Vue 3 + Vite + TypeScript
- **Backend / Runtime:** Electron + Node.js
- **Network:** UDP broadcast discovery + HTTP transfer



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



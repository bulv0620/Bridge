# 🛰️ Bridge

> ⚡ A cross-platform LAN collaboration tool built with **Electron + Vite + Vue3**, designed for fast, private, and intelligent local network communication.

**Bridge** turns your local network into a small, intelligent ecosystem — enabling device discovery, file synchronization, and shared downloading with a single click.

English | [简体中文](./README.zh-CN.md)

## ✨ Features
- 📁 **File Sync & Compare**
   Compare directory trees between local and remote (FTP) paths and synchronize files intelligently.
- 🌐 **LAN File Sharing**
   Auto-discovers devices over UDP broadcast.
   Share local files instantly — peers download via an HTTP service by file ID, without exposing your paths.
- ⬇️ **Integrated Downloader**
   Built-in **Aria2** engine supporting HTTP, FTP, and BitTorrent.
   Unified task list for both Internet and LAN downloads.

## 📦 Tech Stack
- **Frontend:** Vue 3 + Vite + TypeScript
- **Backend / Runtime:** Electron + Node.js
- **Network:** UDP broadcast discovery + HTTP transfer
- **Downloader:** Aria2 RPC integration

## 🚀 Cross-Platform

Works on **Windows**, **macOS**, and **Linux**.
 Optimized for offline or intranet environments.


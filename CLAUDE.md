# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development mode (electron-vite dev)
npm run build        # Typecheck + build all processes
npm start            # Preview the built app
npm run lint         # ESLint fix across all source files
npm run format       # Prettier format
npm run typecheck    # Full typecheck: tsconfig.node + tsconfig.web
npm run typecheck:node  # Typecheck main + preload only
npm run typecheck:web   # Typecheck renderer only

# Platform builds
npm run build:win    # Build Windows installer (NSIS)
npm run build:mac    # Build macOS DMG
npm run build:linux  # Build Linux AppImage + deb
npm run build:unpack # Build unpacked (--dir, no installer)
```

There is no test suite.

## Architecture

This is an **Electron** app built with **electron-vite**, using **Vue 3 + Element Plus + TypeScript** for the renderer. It provides two major features: **file sync** (local/FTP/S3) and **LAN sharing** (device discovery + file transfer + clipboard sharing).

Three source directories map to the three Electron processes:

| Directory | Process | Description |
|-----------|---------|-------------|
| `src/main/` | Main | Node.js backend, IPC handlers, services |
| `src/preload/` | Preload | Context bridge: exposes `window.ipc`, `window.events`, `window.remoteRef` |
| `src/renderer/` | Renderer | Vue 3 UI, Element Plus, vue-router (hash), vue-i18n |

### IPC: Two-layer auto-generated RPC

**Main → Renderer invoke (renderer calls main):**
`src/main/modules/eventLoader.ts` scans the `modules/file`, `sync`, `share`, `update` exports and registers every function as an `ipcMain.handle()` under `"{namespace}:{functionName}"`. The preload's `handler.ts` calls `get-events-map` at startup to discover all handlers, then builds `window.ipc.{namespace}.{function}()` — so any function exported from a module under `src/main/modules/` automatically becomes callable from the renderer.

**Main → Renderer events (main pushes to renderer):**
`window.events.on/off/once(channel, callback)` wraps `ipcRenderer.on`. The main process uses `webContents.send(channel, data)` directly.

### RemoteRef: Reactive shared state

`src/main/utils/remoteRef.ts` — a custom reactive primitive that syncs state between main and renderer via IPC. Used for theme, locale, device info, LAN settings, online device list, transfer lists, etc.

- Main: `remoteRef<T>(channel, initialValue)` → returns an object with `.value` getter/setter, `.update(fn)`, `.onUpdate(fn)`, `.destroy()`
- Renderer: `useRemoteRef<T>(channel, initialValue)` → returns a Vue `shallowRef`-like object
- Changes broadcast via `remote-ref:change:/*` and `remote-ref:update:/*` IPC channels

### Main process structure

```
src/main/
├── index.ts              # App entry: single-instance lock, window, tray, config, events
├── config/               # App config initializers (device, locale, share, theme)
├── locales/              # i18n messages (en_US, zh_CN) for main process UI
├── store/                # electron-store for persistent settings (schema + types)
├── modules/
│   ├── eventLoader.ts    # Auto-registers all module exports as IPC handlers
│   ├── file/index.ts     # Folder selection, open-in-explorer
│   ├── sync/index.ts     # Sync IPC handlers → manages SyncSession + StorageSession maps
│   ├── share/index.ts    # Share IPC handlers → DeviceDiscovery + ShareServer lifecycle
│   └── update/index.ts   # Auto-updater IPC handlers
├── types/                # Shared type declarations (*.d.ts): sync, share, theme, etc.
└── utils/                # window, tray, menu, update, remoteRef, clipboardProtocol
```

### File sync engine (`src/main/modules/sync/`)

The sync pipeline:
1. **StorageEngine** (abstract) — pluggable backend with implementations in `core/storage-engine/impl/`: `LocalStorageEngine`, `FtpStorageEngine`, `S3StorageEngine`. Factory: `StorageEngineFactory.ts`.
2. **StorageSession** — wraps a StorageEngine instance for directory browsing (used by the connection modal).
3. **SyncSession** — the core: compares source/destination trees with a stack-based directory walker, stores diff results in `DiffStore` (in-memory tree, lazy-loadable), supports three strategies (mirror, incremental, twoWay), handles file transfer via stream piping, and sends progress events to renderer.
4. **DiffStore** — keyed by a composite ID (`[D]path` or `[F]path`), supports hierarchical `getChildren(parentId)` for tree display.

### LAN sharing (`src/main/modules/share/`)

- **DeviceDiscovery** — UDP broadcast on configurable port; announces device presence, discovers peers, tracks online/stale/offline status, triggers clipboard fetch on remote change
- **ShareServer** — Express server (configurable HTTP port) with endpoints: `GET /api/clipboard/:v` (fetch clipboard content), `POST /api/upload/request` (request file transfer), `POST /api/upload/:uploadId` (receive file)
- **ClipboardManager** — manages clipboard state history, fetches remote clipboard content

### Renderer architecture

```
src/renderer/src/
├── main.ts               # Vue app bootstrap: ElementPlus, i18n, router, directives
├── App.vue               # Root: el-config-provider + layout, listens for page:link events
├── layout/               # Sidebar + router-view with keep-alive
├── router/               # 3 routes: FileSync (/) , Setting (/setting), SharedZone (/shared-zone)
├── locales/              # vue-i18n messages
├── composables/          # All state management (no Vuex/Pinia)
│   ├── file-sync/        # useSyncSession, useActiveSyncSession, useConnectionModal, useIgnoredFoldersModal
│   ├── share-zone/       # useTaskList, useCollapse, useSettingModal
│   ├── remote-ref/       # useRemoteRef
│   ├── setting/          # useLang, useTheme
│   └── update/           # useAppUpdate
├── views/
│   ├── file-sync/        # Sync form, file diff tree, toolbar, status bar
│   ├── shared-zone/      # Devices, clipboard, file uploader, task tables
│   └── setting/          # Theme/language settings
├── components/           # Shared components: CommonDialog, SvgIcon, DropZoneOverlay, AppVersion
├── directives/           # Custom Vue directives (dialog-drag)
└── utils/                # Formatting, file icons, task info helpers
```

### Global types

Type declarations in `src/main/types/*.d.ts` use `declare type` (not export/import) so they are ambient globals available across the entire project. Key types: `StorageEngineConfig`, `FileDifference`, `FileInfo`, `SyncStrategy`, `OnlineDevice`, `AnnounceMessage`, `ReceivingItem`, `SendingItem`, `CacehdSession`.

### Configuration & persistence

- **electron-store** (`src/main/store/`) persists user settings to disk with JSON schema validation (`schema.ts`, `types.ts`)
- Settings are bootstrapped via `RemoteRef` instances in `src/main/config/` — each config module initializes a RemoteRef from the store, then sets up watchers that persist changes back. The renderer reads/writes these via `useRemoteRef()`.
- Settings include: theme, locale, deviceId, deviceName, ports (UDP/HTTP), LAN discovery toggle, capabilities, download path, cached sync sessions

# 架构总览

## 运行时结构

Bridge 采用 Electron 的三个执行边界：

```text
Vue Renderer
  │ window.ipc / window.events / window.remoteRef
  ▼
Preload（context bridge）
  │ invoke、event、RemoteRef channel
  ▼
Electron Main
  ├─ config / store
  ├─ sync
  ├─ share
  ├─ update / logging
  └─ filesystem / network / native UI
```

### 主进程

`src/main/` 拥有所有 Node.js、Electron、文件系统和网络能力：

- `index.ts`：应用启动、单实例、窗口、托盘、协议及全局错误处理。
- `modules/`：按 namespace 暴露 IPC 请求处理器。
- `config/`：主题、语言、设备、共享和日志的运行时配置。
- `store/`：基于 `electron-store` 的持久化设置。
- `services/logging/`：结构化日志、脱敏和诊断导出。
- `utils/`：窗口、托盘、菜单、更新、自定义协议和 RemoteRef。

### Preload

`src/preload/` 是唯一允许渲染进程访问主进程能力的桥：

- `handler.ts` 根据主进程的事件表生成 `window.ipc`。
- `listener.ts` 将主进程主动事件暴露为 `window.events`。
- `remoteRefBridge.ts` 暴露 `window.remoteRef`。

渲染进程不得直接引入 Electron 或 Node.js API。

### 渲染进程

`src/renderer/src/` 负责路由、界面和交互状态：

- `/`：文件同步。
- `/shared-zone`：局域网文件和剪贴板共享。
- `/setting`：主题、语言、日志和更新。
- `composables/`：跨组件交互状态和桥接调用。
- `locales/`：渲染层中英文文案。

## 主要业务流

### 同步

```text
用户配置端点
  → 主进程创建 StorageEngine
  → 校验两个端点
  → SyncSession 深度遍历并生成 DiffStore
  → Renderer 懒加载差异树
  → 用户可调整 resolution
  → SyncSession 逐项删除/复制
  → 主进程推送进度
```

`StorageEngine` 定义共同能力，工厂按配置创建 Local、FTP 或 S3 实现。`SyncSession` 拥有比较
算法、策略映射、统计和执行语义。`DiffStore` 是内存数据结构，不是持久化数据库。

### 局域网共享

```text
RemoteRef 设置启用发现/能力
  → UDP 广播设备、HTTP 端口和能力
  → Renderer 展示在线设备
  → Sender 请求上传
  → Receiver 原生确认
  → HTTP 流式上传
  → 两端更新运行时任务列表
```

剪贴板只在双方都声明 `clipboard` 能力时根据广播版本拉取内容。

### 配置与状态

设置由 `electron-store` 持久化，配置模块用 RemoteRef 将变化同步给渲染进程。同步会话只持久化
表单，不持久化比较树和运行进度。详细状态所有权见
[`ipc-and-state.md`](ipc-and-state.md)。

## 依赖方向

允许的主要方向：

```text
renderer views → renderer composables → preload public API
main modules → main services/config/store/utils
sync services → sync core/storage engines
```

禁止或需要避免：

- renderer 直接依赖 `electron`、`fs`、`path` 等系统能力。
- preload 承载业务规则或直接读写持久化数据。
- 主进程依赖 Vue 响应式状态。
- 存储引擎实现反向依赖 UI 或特定同步页面。
- 绕过 `StorageEngineFactory` 在业务代码中直接选择具体引擎。

## 生命周期

- 应用取得单实例锁后等待 Electron ready。
- ready 后注册自定义剪贴板协议、IPC、主窗口、托盘和配置监听。
- 主窗口关闭默认隐藏；`global.quitFlag` 为真时才退出。
- 同步会话由 renderer 创建和关闭；关闭时主进程应释放引擎和差异数据。
- 局域网服务由 `lanDiscovery` 配置启停。

## 架构敏感区域

以下改动至少属于 M 级，通常需要 Spec；改变安全或数据语义时属于 L 级：

- preload 暴露面、IPC 参数或 RemoteRef channel。
- `StorageEngine` 抽象或同步比较/执行流程。
- `electron-store` schema 和已有配置迁移。
- UDP/HTTP 协议、端口、网络监听范围或接收路径。
- 更新、签名、诊断导出和日志脱敏。
- 窗口关闭/退出、托盘和跨平台标题栏行为。

# IPC 与状态所有权

## IPC 生成机制

主进程在 `src/main/modules/eventLoader.ts` 的 `eventsMap` 中注册 namespace。模块 `index.ts`
导出的每个函数会成为 `<namespace>:<exportName>` IPC handler，preload 启动时读取事件表并生成
`window.ipc.<namespace>.<exportName>()`。

共享类型由 `src/main/types/*.d.ts` 提供，`EventsMapType` 推导 renderer 可见的 IPC 方法类型。

新增接口时必须：

1. 放入正确的主进程 namespace。
2. 为所有 renderer 输入做运行时校验，不能只依赖 TypeScript。
3. 避免返回不可结构化克隆的值。
4. 说明失败方式，不以静默 `undefined` 掩盖非法会话或输入。
5. 如果新增 namespace，同步加入 `eventsMap`。

## 当前 IPC 清单

| Namespace | 方法                                                                           | 责任与风险                     |
| --------- | ------------------------------------------------------------------------------ | ------------------------------ |
| `file`    | `selectFolder`, `openFolder`                                                   | 原生目录选择、在系统中定位文件 |
| `sync`    | 会话、端点、比较、resolution、同步、容量、连接浏览                             | 文件读写和删除，数据安全高风险 |
| `share`   | `startService`, `stopService`, `writeContent`, `getMyDeviceInfo`               | 网络服务和剪贴板输入           |
| `update`  | `getCurrentVersion`, `check`, `download`                                       | 外部网络、下载和安装           |
| `log`     | `write`, `getDiagnosticsStatus`, `openDirectory`, `exportDiagnostics`, `clear` | 日志输入、文件导出和删除       |

函数的精确签名以对应 `src/main/modules/*/index.ts` 和共享类型为准。此表用于说明所有权，不重复
维护容易漂移的完整 TypeScript 声明。

## 主进程主动事件

`window.events` 当前用于：

- `sync:updateStatus:<sessionId>`：同步进度。
- `page:link`：主进程菜单/托盘导航。
- `new-version-ready`：更新已下载。
- `new-version-download-failed`：更新下载失败。

订阅者必须保存同一个回调引用，并在 composable 或组件销毁、任务完成时调用 `off`。动态 channel
必须包含受控标识符，不能由不可信网络输入直接构造。

## RemoteRef

RemoteRef 用于主进程所有、renderer 观察或修改的轻量状态。当前主要 channel 包括：

| Channel                                                    | 所有者             | 是否持久化       |
| ---------------------------------------------------------- | ------------------ | ---------------- |
| `theme-mode`, `current-theme`                              | 主进程 config      | mode 持久化      |
| `current-locale`, `log-level`                              | 主进程 config      | 是               |
| `device-id`, `device-name`                                 | 主进程 config      | 是               |
| `lan-discovery`, `share-capabilities`                      | 主进程 config      | 是               |
| `download-path`, `http-port`, `udp-port`, `share-interval` | 主进程 config      | store 中有对应值 |
| `online-devices`                                           | `DeviceDiscovery`  | 否               |
| `receiving-list`, `received-list`                          | `ShareServer`      | 否               |
| `clipboard-history`                                        | `ClipboardManager` | 否               |

RemoteRef channel 是内部协议。重命名会同时影响 main、preload 和 renderer，应作为契约变更处理。
RemoteRef 不提供身份认证、授权或输入校验；从 renderer 写入的值仍属于不可信输入。

## 持久化数据

`electron-store` 使用 `settings` store，当前 schema 包含：

- `theme`, `locale`, `logLevel`
- `deviceId`, `deviceName`
- `lanDiscovery`
- `ports.udp`, `ports.http`
- `shareInterval`, `capabilities`, `downloadPath`
- `syncSessions`

`syncSessions` 只保存 session id、名称和表单配置，因此可能包含 FTP/S3 连接信息。任何修改其结构、
日志记录或诊断导出的任务都必须检查凭据泄漏和已有数据迁移。

改变 schema 时必须在 Spec 中说明：

- 新旧结构和默认值。
- 已安装用户如何迁移。
- 无效或部分数据如何处理。
- 是否存在凭据或隐私影响。
- 降级到旧版本的行为。

## 安全边界

- IPC sender 默认来自应用 renderer，但仍不能信任参数。
- 网络设备声明、文件元数据、HTTP body 和剪贴板数据是不可信输入。
- 路径必须由主进程规范化并限制在授权目录内。
- renderer 日志经过速率限制和脱敏，但调用方仍不应提交敏感字段。
- `shell.openExternal`、`shell.openPath`、文件选择和更新安装属于系统副作用，新增调用必须明确授权范围。

# AGENTS.md

本文档为在本仓库中工作的自动化编码代理提供项目级约定。除非任务另有明确要求，修改代码时应遵循以下规则。

## 项目概览

Bridge 是一款基于 Electron 的跨平台文件同步与局域网共享应用。

- 主进程：`src/main/`
- 预加载脚本：`src/preload/`
- Vue 渲染进程：`src/renderer/src/`
- 构建资源：`build/`、`resources/`
- 构建产物：`out/`（不要手动编辑或提交生成内容）

主要技术栈为 Electron 31、Vue 3、TypeScript、Vite、Element Plus 和 electron-builder。开发及 CI 使用 Node.js 20 和 npm。

## 常用命令

```bash
npm install             # 安装依赖及原生 Electron 依赖
npm run dev             # 启动开发模式
npm run typecheck       # 检查主进程、预加载层和渲染层类型
npm run lint            # ESLint 检查并自动修复
npm run format          # 使用 Prettier 格式化整个仓库
npm run build           # 类型检查并生成生产构建
npm run build:unpack    # 生成未打包应用，便于本地验证
```

平台安装包分别使用 `npm run build:win`、`npm run build:mac` 和 `npm run build:linux`。不要在普通代码修改中执行发布流程或创建版本标签。

仓库目前没有自动化测试脚本。提交修改前至少运行 `npm run typecheck`；代码风格或静态检查相关修改还应运行 `npm run lint`。涉及构建配置、Electron 主进程、预加载层或打包行为时，再运行 `npm run build`。

## 架构边界

- `src/main/` 负责文件系统、网络、持久化、托盘、更新及 Electron 生命周期等 Node/Electron 能力。
- `src/preload/` 是主进程与渲染进程之间的安全桥接层。不要在渲染层直接引入 Node.js 或 Electron API。
- `src/renderer/src/` 只负责界面、交互状态与调用预加载层暴露的 API。
- IPC 请求处理器按 `src/main/modules/<namespace>/index.ts` 组织，并在 `src/main/modules/eventLoader.ts` 中注册。新增命名空间时同步更新 `eventsMap`；新增导出处理器会自动以 `<namespace>:<eventName>` 暴露。
- 主进程主动推送的事件应通过 `window.events` 订阅，并在组件或 composable 销毁时移除监听，避免重复回调和内存泄漏。
- 跨层共享类型优先放在 `src/main/types/`，并保持 `tsconfig.node.json` 与 `tsconfig.web.json` 均可解析。

## 代码约定

- 使用 TypeScript；Vue 组件使用 Vue 3 Composition API，并沿用所在目录现有写法。
- 渲染层导入优先使用 `@renderer/*` 别名，避免跨越多级目录的相对路径。
- 格式遵循 `.editorconfig` 和 `.prettierrc`：2 空格缩进、单引号、无分号、尾随逗号、单行建议不超过 100 字符。
- 不要为了通过检查而引入无意义的 `any`、非空断言或禁用规则；修改公共类型时同步更新调用方。
- 未使用参数如因接口约束必须保留，以 `_` 开头。
- 保持改动聚焦，不顺带重构无关代码，不修改 `node_modules/`、`out/` 或依赖锁文件之外的生成产物。
- 只有依赖确实发生变化时才更新 `package-lock.json`；使用 npm，不要混入其他包管理器的锁文件。

## UI 与国际化

- 复用现有 Element Plus 组件、全局组件和 `src/renderer/src/assets/` 中的样式，不重复实现已有交互模式。
- 新增面向用户的文本时使用 i18n，不在 Vue 组件中硬编码中文或英文。
- 渲染层翻译位于 `src/renderer/src/locales/zh_CN.json` 和 `en_US.json`；主进程翻译位于 `src/main/locales/zh_CN.json` 和 `en_US.json`。新增或删除键时保持同一层的中英文文件结构一致。
- 涉及窗口尺寸、拖拽、托盘或对话框时，至少验证 Windows 下的基本交互，并避免破坏 macOS/Linux 条件分支。

## 文件同步与共享代码

- `src/main/modules/sync/` 包含同步会话、差异存储和本地/FTP/S3 存储引擎。新增存储能力时实现现有 `StorageEngine` 抽象，并通过 `StorageEngineFactory` 创建。
- 同步策略和冲突处理属于数据安全敏感逻辑。不要未经明确需求改变删除、覆盖、忽略或双向同步语义。
- 文件路径处理必须兼容 Windows、macOS 和 Linux；使用 Node.js `path` API，不手工拼接路径分隔符。
- 网络、文件和剪贴板输入视为不可信数据。校验路径、文件名、连接参数及 IPC 参数，不向渲染层暴露任意系统能力。
- 日志和错误信息不得包含访问密钥、密码、令牌或完整的敏感剪贴板内容。

## 完成标准

交付前应确认：

1. 修改位于正确的进程层级，没有绕过 preload/IPC 边界。
2. 新增用户文本已补齐对应的中英文翻译。
3. `npm run typecheck` 通过；适用时 `npm run lint` 和 `npm run build` 也通过。
4. 没有提交构建产物、临时文件、凭据或无关格式化改动。
5. 最终说明列出改动、实际执行的校验，以及未能验证的内容。

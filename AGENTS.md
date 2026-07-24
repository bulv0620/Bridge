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

长期产品、架构和领域规则位于 `docs/`。开始任务前先阅读 `docs/README.md`，再按其阅读路径选择
与任务有关的文档；不要只根据 README、代码注释或现有 UI 推断产品语义。

## 文档权威性

同一问题出现冲突时按以下顺序处理：

1. 已批准且仍在实施的 Spec，决定本次变更的目标行为。
2. `docs/behavior/` 中的领域规则。
3. `docs/decisions/` 中未被废弃的 ADR。
4. `docs/architecture/` 和 `docs/product/` 记录的当前事实。
5. 代码和自动化测试证明的实际行为。
6. 用户 README、注释和历史记录作为辅助信息。

批准的 Spec 与长期文档不同，通常意味着本次实现需要同步更新长期文档。代码与长期文档不同
时，不要默默选择一方；先判断是代码缺陷还是文档漂移，并在任务结果中说明。

## 任务分级与 Spec

迭代流程以 `docs/specs/README.md` 为准：

- S 级：文案、局部样式、根因明确的小 Bug、无行为变化的简单清理，可以直接实现。
- M 级：用户可观察的交互/功能调整、局部新功能、IPC 变化或中型重构，先写简短 Spec。
- L 级：同步删除/覆盖/冲突、网络与路径安全、持久化迁移、核心能力或大型架构调整，必须先完成
  完整 Spec，并由用户明确批准后实现。

原因未知的 Bug 先只读调查和复现，不把可疑代码直接当成根因。实现阶段如发现需要改变用户行为、
数据格式、安全边界或已批准范围，应暂停扩大修改并报告。验收时不得修改 Spec 来迁就实现。

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

仓库目前没有自动化测试脚本。提交修改前至少运行 `npm run typecheck`；代码风格或静态检查相关修改还应运行 `npm run lint`。普通业务开发本地通常不运行生产 build；涉及构建配置、打包、更新、签名、公证或 CI 时，再按风险运行 `npm run build` 或 `npm run build:unpack`。正式跨平台构建由 release tag 触发的 GitHub Actions 完成。

`npm run lint` 当前包含 `--fix`，会修改文件；运行前后检查工作区，避免混入无关自动修复。不同
改动的验证矩阵、手工场景和交付证据格式见 `docs/quality/verification.md`。

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
- 当前同步相等判定、三种策略决策表、方向、停止和空目录语义以
  `docs/behavior/sync-semantics.md` 为准；不要根据策略名称推导代码未保证的行为。
- 同步策略和冲突处理属于数据安全敏感逻辑。不要未经明确需求改变删除、覆盖、忽略或双向同步语义。
- 同步和删除验证只能使用为任务创建的临时目录或专用测试端点，不得使用用户真实目录、仓库根
  目录或真实备份数据。
- 局域网发现、文件传输和剪贴板协议以 `docs/behavior/lan-sharing.md` 为准。网络设备声明、
  文件元数据、HTTP body 和剪贴板数据都不可信；新增或修改协议必须说明版本兼容和安全影响。
- 文件路径处理必须兼容 Windows、macOS 和 Linux；使用 Node.js `path` API，不手工拼接路径分隔符。
- 网络、文件和剪贴板输入视为不可信数据。校验路径、文件名、连接参数及 IPC 参数，不向渲染层暴露任意系统能力。
- 日志和错误信息不得包含访问密钥、密码、令牌或完整的敏感剪贴板内容。

## 文档同步

实现完成时按影响更新文档：

- 用户可观察的长期行为变化：更新 `docs/behavior/`。
- 模块边界、IPC/RemoteRef、状态所有权或持久化变化：更新 `docs/architecture/`。
- 产品定位或当前能力变化：更新 `docs/product/`，适用时同步中英文 README。
- 对未来有持续约束且需要保留理由的架构选择：新增或替代 ADR。
- 单次变更：更新 active Spec 的状态和验收记录；Verified 后将稳定规则沉淀到长期文档再归档。

文档中的计划能力不得写成当前事实。不要为 S 级改动创建空洞 Spec。

## Git 提交与发布

commit、push、版本和发布流程以 `docs/operations/release.md` 为准。

- 一个完整、可独立回退的逻辑修改对应一个 Conventional Commit；不要按文件机械拆分，也不要
  把无关修改混入同一个 commit。
- 实现完成或 Spec 归档不自动授权 Git 或发布操作。只有用户明确说“提交”“提交并推送”“提交并
  发版”或“发版”时，才执行对应范围。
- “提交并发版”授权 Agent 连续完成普通 commit、push、`npm run release`、release commit/tag
  push 和 GitHub Actions 跟踪；满足停止条件时必须暂停。
- `npm run release` 前必须位于与 `origin/main` 一致的干净 `main`，本次普通 commit 已 push，
  typecheck 已通过，Spec 没有 Fail。
- standard-version 生成 `chore(release): X.Y.Z` commit 和 `vX.Y.Z` tag。检查版本与
  CHANGELOG 后，先 push `main`，再 push 本次精确 tag；不要默认使用 `git push --tags`。
- tag 触发 GitHub Actions 后，正式构建、macOS 签名与公证在 CI 完成。本地不读取或处理 GitHub
  secrets，也不以关闭签名/公证的方式绕过失败。
- 已推送 tag 不得移动、覆盖或擅自删除；发布失败按规范报告和处理，不 force-push。

## 完成标准

交付前应确认：

1. 修改位于正确的进程层级，没有绕过 preload/IPC 边界。
2. 新增用户文本已补齐对应的中英文翻译。
3. `npm run typecheck` 通过；适用时 `npm run lint` 和 `npm run build` 也通过。
4. 没有提交构建产物、临时文件、凭据或无关格式化改动。
5. 最终说明列出改动、实际执行的校验，以及未能验证的内容。
6. 有 Spec 的任务逐条记录 Pass、Fail 或 Not Verified，失败项不得通过弱化 Spec 消除。
7. 受影响的长期文档已同步，或明确说明为何无需更新。

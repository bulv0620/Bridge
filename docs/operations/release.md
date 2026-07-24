# Git 提交与发布流程

本文规定 Bridge 的 commit、push、版本生成和 GitHub Release 流程。Agent 只有在用户明确授权
对应动作后才能改变 Git 历史、远端仓库或发布状态。

## 基本原则

- 一个完整、可解释、可独立回退的逻辑修改对应一个普通 commit。
- 一个逻辑修改可以同时包含实现、测试、i18n、长期文档和已完成的 Spec，不按文件数量拆 commit。
- 不同目的的修改不要混入同一个普通 commit。
- 多个普通 commit 可以共同进入一次 release；不要求每个 commit 都产生一个新版本。
- `npm run release` 生成的版本 commit 和 tag 独立于普通修改 commit。
- 正式跨平台构建、macOS 签名与公证由 tag 触发的 GitHub Actions 完成，本地通常不构建安装包。

## 用户授权语义

以下短语是推荐的明确授权方式：

| 用户指令     | Agent 获得的授权                                                                      |
| ------------ | ------------------------------------------------------------------------------------- |
| “提交”       | 暂存本次任务文件并创建一个普通 commit；不 push                                        |
| “提交并推送” | 创建普通 commit，并 push 当前任务分支；不发版                                         |
| “提交并发版” | 创建并 push 普通 commit，执行 release，push release commit 和本次 tag，并跟踪 Actions |
| “发版”       | 对已经提交并推送的当前版本执行 release；不重新提交无关修改                            |

“实现完成”“验收通过”“归档 Spec”本身不包含 commit、push 或 release 授权。用户明确说“提交并
发版”后，Agent 可以连续完成表中全部动作，不需要在每条正常命令前重复询问；遇到本文定义的
停止条件时仍必须暂停。

## 普通 commit 规范

仓库使用 Angular 风格的 Conventional Commits：

```text
<type>(<scope>): <description>
```

常用类型：

| Type       | 用途                       |
| ---------- | -------------------------- |
| `feat`     | 新功能或用户可观察能力     |
| `fix`      | Bug 修复                   |
| `perf`     | 性能改进                   |
| `refactor` | 不改变外部行为的重构       |
| `docs`     | 只修改文档                 |
| `style`    | 不改变逻辑的格式或样式整理 |
| `test`     | 测试及夹具                 |
| `build`    | 构建系统或依赖             |
| `ci`       | GitHub Actions 等 CI 配置  |
| `chore`    | 其他维护工作               |

scope 使用稳定的业务或工程领域，例如 `sync`、`share`、`ipc`、`ui`、`logging`、`release`。
description 使用英文祈使式或简洁动词短语，不加句号。例如：

```text
feat(share): support secure batch file transfers
fix(sync): preserve ignored destination files
docs(release): document automated release workflow
```

不兼容变化使用 `!`，并在正文中说明：

```text
feat(share)!: replace the legacy file transfer protocol

BREAKING CHANGE: legacy file-push clients can no longer transfer files.
```

Agent 创建 commit 前必须检查 staged diff，确保只包含当前任务范围。工作区存在无关修改时不得
暂存、覆盖或提交它们；无法安全分离时停止并报告。

## Spec 到 commit 的条件

M/L 级任务进入普通 commit 前应满足：

1. Spec 已达到 `Verified`，没有 `Fail`。
2. `Not Verified` 已如实记录；如果它影响发布判断，需要用户明确接受。
3. 稳定行为已经同步到长期文档。
4. Spec 已归档，或归档动作包含在同一个普通 commit 中。
5. 适用验证已完成，结果与限制已记录。

S 级任务没有独立 Spec 时，仍需满足任务目标、最低验证和文档同步要求。

## 普通提交与推送

Agent 按以下顺序执行：

1. 检查当前分支、远端、工作区和 staged 状态。
2. 运行任务要求的验证；普通本地开发至少运行 `npm run typecheck`。
3. 查看完整 diff，按当前逻辑修改选择文件。
4. 创建符合 Conventional Commits 的普通 commit。
5. 再次确认 commit 内容和工作区剩余修改。
6. 用户授权包含 push 时，将该 commit push 到对应远端分支。

正常发布分支是 `main`。如果功能在其他分支完成，必须先按用户指定方式合并到 `main`；Agent
不得为了发版自行选择 merge、rebase 或 force-push 策略。

## Release 前置条件

执行 `npm run release` 前必须同时满足：

- 用户已明确授权发版。
- 当前分支是 `main`。
- 本次需要发布的普通 commit 已 push。
- `main` 与 `origin/main` 一致，不存在未拉取或未推送 commit。
- 工作区和 index 干净。
- `npm run typecheck` 已通过。
- 没有未解决的 Spec `Fail`。
- 当前 HEAD 没有对应 release tag。

普通功能发布前本地通常不运行 `npm run build`。涉及构建脚本、electron-builder、签名、公证或
Actions 本身时，应按任务风险额外验证；正式平台构建仍以 GitHub Actions 为准。

任一条件不满足时不得强行 release、stash 用户修改、reset、force-push 或临时删除文件来制造
干净状态。

## 创建版本

项目的 `npm run release` 执行 `standard-version`，配置使用 Angular preset。默认流程会：

1. 根据上一个 tag 之后的 Conventional Commits 计算版本。
2. 更新 `package.json` 和 `package-lock.json`。
3. 更新 `CHANGELOG.md`。
4. 创建 `chore(release): X.Y.Z` commit。
5. 创建 `vX.Y.Z` tag。

默认版本通常由提交语义决定：

- `fix` 对应 patch。
- `feat` 对应 minor。
- `BREAKING CHANGE` 对应 major。

如果用户明确指定版本级别，可以使用：

```bash
npm run release -- --release-as patch
npm run release -- --release-as minor
npm run release -- --release-as major
```

Agent 不得自行强制指定 major/minor/patch 来绕过提交语义或用户决定。

## Release 检查与推送

`npm run release` 成功后，push 前必须检查：

- release commit 只包含版本号、lockfile 和 CHANGELOG 等预期变化。
- CHANGELOG 包含本次应发布的修改，没有明显遗漏或无关内容。
- 新 tag 指向 release commit。
- 版本号与用户指定或 Conventional Commits 计算结果一致。

检查通过后按顺序推送：

```bash
git push origin main
git push origin vX.Y.Z
```

第二条命令中的 tag 必须替换为本次刚创建的精确 tag。默认不使用 `git push --tags`，避免推送
其他本地 tag；不得 force-push release commit 或 tag。

## GitHub Actions 与发布完成

push `v*` tag 会触发 `.github/workflows/release.yml`。当前矩阵为：

- macOS arm64
- Linux x64
- Linux arm64
- Windows x64

每个平台在 Actions 中安装依赖、执行包含 typecheck 的生产构建，并通过 electron-builder
发布到 GitHub Release。

macOS 在 Actions 中完成：

- 使用 `CSC_LINK` 和 `CSC_KEY_PASSWORD` 进行代码签名。
- 通过 `build/afterSign.js` 使用 `APPLE_ID`、`APPLE_APP_SPECIFIC_PASSWORD` 和
  `APPLE_TEAM_ID` 完成 Apple 公证。
- 使用 `GH_PAT` 上传发布产物。

这些 secret 由 GitHub 环境管理。Agent 不读取、打印、复制或修改 secret 值，也不在本地尝试
替代正式签名与公证。

“提交并发版”的完成条件不是 tag 已 push，而是对应 GitHub Actions 到达终态：

- 全部成功：报告版本、release commit、tag、Actions 结果和发布地址。
- 仍在运行：继续等待并提供必要进度，除非用户要求停止跟踪。
- 失败：报告失败平台和步骤，不把发布描述为成功。
- 无法访问 Actions：明确区分“已触发发布”和“已确认发布成功”。

## 发布失败处理

- 网络、GitHub 或 Apple 服务的瞬时失败，可以在用户授权下重跑原 workflow。
- secret、签名或公证配置失败时，停止并报告；不得输出 secret 或把签名关闭后重新发布。
- 代码或构建配置缺陷需要普通修复 commit 时，修复后创建一个新版本，不移动已推送 tag。
- 不删除、覆盖或重建已经推送的 release tag。
- 不修改 tag 指向，不 force-push tag。
- GitHub Release 已产生部分产物时，保留现场并报告，由用户决定重跑、补发或创建新版本。

删除 tag、撤回 Release、修改远端历史或重新发布同一版本都属于独立的高风险操作，必须得到用户
针对精确版本的明确授权。

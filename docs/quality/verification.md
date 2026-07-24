# 质量与验证规范

## 当前验证能力

仓库当前提供：

```bash
npm run typecheck
npm run lint
npm run build
npm run build:unpack
```

需要注意：

- `npm run lint` 带 `--fix`，会修改文件，不是纯只读检查。
- 当前没有自动化测试脚本。
- GitHub Actions 目前只在 `v*` tag 上执行构建和发布，没有普通分支/PR CI。
- `npm run build` 会先运行 typecheck，再生成生产构建。

在新增只检查的 lint/format 脚本和测试套件前，交付说明必须如实标注这些限制。

## 按改动类型选择验证

| 改动类型             | 最低自动检查                           | 补充验证                                     |
| -------------------- | -------------------------------------- | -------------------------------------------- |
| Markdown 文档        | 链接、路径和内容一致性检查             | 对照代码抽查事实                             |
| renderer UI/交互     | `npm run typecheck`                    | 中英文、主题、窗口最小尺寸、加载/空/失败状态 |
| renderer 状态逻辑    | `npm run typecheck`                    | 生命周期、重复监听、快速重复操作             |
| preload/IPC/共享类型 | `npm run typecheck`、`npm run build`   | 参数校验、错误传播、暴露面检查               |
| 主进程配置/持久化    | `npm run typecheck`、`npm run build`   | 默认值、旧配置、损坏配置、退出重启           |
| 同步逻辑/存储引擎    | `npm run typecheck`、`npm run build`   | 临时端点矩阵、删除/覆盖/失败/停止            |
| 局域网共享           | `npm run typecheck`、`npm run build`   | 两实例/两设备、拒绝/取消/断线、恶意输入      |
| 构建/打包/更新       | `npm run build`，适用时 `build:unpack` | 目标平台启动、签名/更新环境另行说明          |
| 代码风格规则         | `npm run lint`                         | 运行前记录工作区，确认无无关自动修复         |

如果任务涉及多个类别，取验证要求的并集。

## 数据安全验证规则

同步和文件接收验证必须遵循：

1. 只使用本任务创建并能明确识别的临时目录、测试 bucket 或测试 FTP 路径。
2. 禁止把用户主目录、Downloads、Documents、仓库根目录或真实备份目录作为删除/覆盖测试目标。
3. 每个测试场景开始前记录两端文件树，结束后核对内容而不只核对 UI。
4. 覆盖失败、目标不存在、权限拒绝、网络中断和停止场景。
5. 清理前再次确认目标是本任务创建的测试资源。

自动化测试建立后，测试夹具也必须遵守相同原则。

## 同步最小手工矩阵

影响同步语义时，至少覆盖：

- 仅 source 存在。
- 仅 destination 存在。
- 两侧同名同大小。
- 两侧同名但大小不同。
- 同名文件/目录类型冲突。
- 嵌套目录和被忽略目录。
- 空目录。
- 用户改变 resolution。
- 比较中止和同步中止。
- 读失败、写失败、删除失败。

按受影响后端选择 Local↔Local、Local↔FTP、Local↔S3 或其他组合。没有实际验证的组合必须列为
`Not Verified`，不能由类型检查代替。

## UI 最小手工矩阵

- 简体中文和英文。
- 浅色、深色、跟随系统至少确认受影响状态。
- 主窗口最小尺寸 `880 × 600`。
- 初始、空、加载、成功、失败、禁用、取消状态。
- 长路径、长文件名、长设备名和大数字。
- Windows 非原生标题栏控制区，macOS traffic lights，Linux 标题栏/托盘条件分支。
- 键盘焦点、对话框关闭和重复点击。

只在当前可用平台验证时，应写明平台与未验证平台。

## 验收报告格式

实现完成后按以下格式报告：

```markdown
## 改动

- ...

## Spec 验收

- AC-01: Pass — 证据
- AC-02: Fail — 实际行为
- AC-03: Not Verified — 原因

## 自动检查

- `npm run typecheck`: Pass
- `npm run build`: Pass

## 手工验证

- 环境和步骤

## 未验证与剩余风险

- ...
```

不得为了使当前实现“通过”而反向弱化已批准 Spec。发现差异时先报告，再由用户决定修复实现还是
正式变更 Spec。

## 后续工程化优先项

以下是建议的质量基础设施，不代表已经实现：

1. 增加不自动修复的 `lint:check` 和 `format:check`。
2. 为同步策略决策表、DiffStore 和路径处理增加单元测试。
3. 为 IPC 输入校验和共享服务增加集成测试。
4. 在普通 push/PR 上运行 `npm ci`、typecheck、lint check、test 和 build。
5. 建立最小跨平台打包启动检查。

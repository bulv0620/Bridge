# Bridge 项目文档

本目录记录 Bridge 的长期产品事实、架构边界、领域行为和迭代流程。它面向维护者与编码
Agent，不替代面向用户的 `README.md`。

## 文档分层

| 层级     | 解决的问题                     | 主要位置                        |
| -------- | ------------------------------ | ------------------------------- |
| 产品事实 | Bridge 当前是什么、不是什么    | `product/product-definition.md` |
| 架构事实 | 模块如何协作、状态和接口在哪里 | `architecture/`                 |
| 领域规则 | 用户可观察行为和高风险语义     | `behavior/`                     |
| 变更意图 | 某次迭代要改变什么、如何验收   | `specs/`                        |
| 工程质量 | 不同改动需要哪些验证           | `quality/`                      |
| 发布运维 | 如何 commit、push 和 release   | `operations/`                   |
| 稳定决策 | 为什么选择某个长期方案         | `decisions/`                    |

## 权威性与冲突处理

同一问题出现冲突时，按以下顺序处理：

1. 已批准且仍处于实施中的 Spec，决定本次变更的目标行为。
2. `behavior/` 中的领域文档，决定未被本次 Spec 明确改变的长期行为。
3. `decisions/` 中未被废弃的 ADR，决定架构约束及其理由。
4. `architecture/` 和 `product/` 记录当前系统事实。
5. 代码和自动化测试证明实际行为。
6. 用户 README、注释和历史记录仅作为辅助信息。

如果批准的 Spec 与长期文档不一致，这是需要随实现一起更新的预期差异。如果代码与长期
文档不一致，不应默默选择一方：先确认是代码缺陷还是文档漂移，并在任务中记录处理结论。

## 阅读路径

首次参与项目时按顺序阅读：

1. [`product/product-definition.md`](product/product-definition.md)
2. [`architecture/overview.md`](architecture/overview.md)
3. 与任务有关的 `behavior/` 文档
4. [`specs/README.md`](specs/README.md)
5. [`quality/verification.md`](quality/verification.md)

涉及 IPC、RemoteRef 或持久化时，再阅读
[`architecture/ipc-and-state.md`](architecture/ipc-and-state.md)。
准备提交、推送或发版时，阅读
[`operations/release.md`](operations/release.md)。

## 维护规则

- 文档描述“当前行为”时必须能在代码或验证中找到依据。
- 计划中的能力只能出现在 Draft Spec 或 roadmap 中，不能写成当前事实。
- 改变用户行为、数据格式、IPC 契约或安全边界时，应先更新 Spec，再实现代码。
- 完成变更时，将稳定规则沉淀到 `behavior/` 或 `architecture/`，不要只保留在归档 Spec。
- 不为简单文案、局部样式和无行为变化的小修复创建空洞文档。

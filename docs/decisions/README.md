# 架构决策记录（ADR）

ADR 记录对未来实现持续产生约束、且以后需要知道“为什么”的决策。单次功能需求放在 Spec，
当前代码结构放在 architecture 文档。

适合 ADR 的事项：

- IPC 暴露机制及兼容策略。
- 同步相等判定和恢复模型。
- 持久化或凭据存储方案。
- 局域网身份认证与协议版本策略。
- 测试框架、CI 和发布架构。
- 大型依赖或架构迁移。

不适合 ADR：

- 一次局部样式调整。
- 能直接从代码看出的实现细节。
- 没有备选方案和长期影响的小决定。

## 文件和状态

文件名使用 `NNNN-short-title.md`，编号递增。状态包括：

- Proposed
- Accepted
- Superseded by ADR-NNNN
- Deprecated

## 模板

```markdown
# ADR-NNNN: 标题

- 状态：Proposed
- 日期：YYYY-MM-DD
- 关联 Spec：

## 背景

## 决策

## 备选方案

## 后果

### 正面

### 负面与风险

## 验证与复审条件
```

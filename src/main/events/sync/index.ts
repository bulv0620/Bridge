import { IpcMainInvokeEvent } from 'electron'
import { SyncManager } from './core/SyncManager'
import { PlanManager } from './core/PlanManager'
import { InstanceManager } from './core/InstanceManager'

const syncManager = new SyncManager()
const planManager = new PlanManager()
const instanceManager = new InstanceManager()

// 设置同步引擎配置
export function setStorageEngineConfig(
  _: IpcMainInvokeEvent,
  type: 'source' | 'destination',
  config: StorageEngineConfig | null,
) {
  syncManager.setStorageEngineConfig(type, config)
}

// 验证同步引擎是否可用
export function validate(_: IpcMainInvokeEvent) {
  return syncManager.validateStorageEngine()
}

// 设置忽略文件夹
export function setIgnoredFolders(_: IpcMainInvokeEvent, folders: string[]) {
  syncManager.setIgnoredFolders(folders)
}

// 设置同步策略
export function setSyncStrategy(_: IpcMainInvokeEvent, strategy: SyncStrategy) {
  return syncManager.setSyncStrategy(strategy)
}

// 设置差异项操作
export function setResolution(_: IpcMainInvokeEvent, id: string, resolution: FileSyncResolition) {
  return syncManager.setResolution(id, resolution)
}

// 比对
export function startCompare(_: IpcMainInvokeEvent) {
  return syncManager.compare()
}

// 停止比对
export function stopCompare(_: IpcMainInvokeEvent) {
  return syncManager.setStopFlag(true)
}

// 获取差异项（树形懒加载）
export function getDiffItems(_: IpcMainInvokeEvent, parentId: string | null) {
  return syncManager.getChildren(parentId)
}

// 同步
export function startSync(_: IpcMainInvokeEvent) {
  return syncManager.startSync()
}

// 停止同步
export function stopSync(_: IpcMainInvokeEvent) {
  return syncManager.setStopFlag(true)
}

// 新增方案
export function addPlan(_: IpcMainInvokeEvent, plan: FileSyncPlan) {
  return planManager.add(plan)
}

// 更新方案
export function updatePlan(_: IpcMainInvokeEvent, plan: FileSyncPlan) {
  return planManager.update(plan.id!, plan)
}

// 删除方案
export function removePlan(_: IpcMainInvokeEvent, plan: FileSyncPlan) {
  return planManager.remove(plan.id!)
}

// 获取所有方案
export function getAllPlan(_: IpcMainInvokeEvent) {
  return planManager.getAll()
}

// 创建连接实例
export function createInstance(_: IpcMainInvokeEvent, config: StorageEngineConfig) {
  return instanceManager.createInstance(config)
}

// 实例目录列表获取
export function listInstance(_: IpcMainInvokeEvent, dir: string) {
  return instanceManager.listInstance(dir)
}

// 获取实例配置
export function getInstanceConfig(_: IpcMainInvokeEvent) {
  return instanceManager.getInstanceConfig()
}

// 释放实例
export function clearInstance(_: IpcMainInvokeEvent) {
  return instanceManager.clearInstance()
}

import { FtpFileSystem, LocalFileSystem } from '@renderer/utils/file-system'
import { FileInfo } from '@renderer/utils/file-system/FileSystem.adstract'
import { FileSystem } from '@renderer/utils/file-system/FileSystem.adstract'
const path = window.api.path

export enum EDiffType {
  onlySource = 'onlySource',
  onlyTarget = 'onlyTarget',
  conflict = 'conflict',
}

export enum EDiffAction {
  toLeft = 'toLeft',
  toRight = 'toRight',
  ignore = 'ignore',
  conflict = 'conflict',
}

export enum EDiffStatus {
  waiting = 'wait',
  processing = 'processing',
  success = 'success',
  error = 'error',
}

export enum ESyncType {
  mirror = 'mirror',
  twoWay = 'two-way',
  increment = 'increment',
}

export interface DiffFile {
  diffType: EDiffType
  source: FileInfo | null
  target: FileInfo | null
  action?: EDiffAction
  status?: EDiffStatus
  error?: Error
}

export interface FolderInfo {
  type: 'local' | 'ftp' | ''
  path: string
  ftpConfig?: FtpConfig
}

export interface FtpConfig {
  host: string
  port: number
  user: string
  password: string
}

/**
 * 规范路径
 */
function unifyPath(filePath: string) {
  // 先使用 path.normalize 规范化路径（例如，将多余的“.”和“..”清理掉）
  const normalized = path.normalize(filePath)
  // 将当前平台的分隔符替换为 POSIX 的分隔符（即 '/')
  // 例如：在 Windows 上将 '\' 替换为 '/'
  return normalized.split(path.sep).join(path.posix.sep)
}

/**
 * 对比两个目录下的文件列表，返回包含差异项的统一数组，每项包含 diffType 字段
 */
function diffFileListsUnified(sourceFiles: FileInfo[], targetFiles: FileInfo[]): DiffFile[] {
  const diffs: DiffFile[] = []

  // 建立目标文件的 Map，以 relativePath 为 key
  const targetMap = new Map()
  targetFiles.forEach((file) => {
    targetMap.set(unifyPath(file.relativePath), file)
  })

  // 遍历源文件列表
  sourceFiles.forEach((sourceFile) => {
    const targetFile = targetMap.get(unifyPath(sourceFile.relativePath))
    if (!targetFile) {
      // 仅源端存在
      diffs.push({
        diffType: EDiffType.onlySource,
        source: sourceFile,
        target: null,
      })
    } else {
      // 比较文件大小和时间戳
      const sourceTime =
        sourceFile.timestamp instanceof Date ? sourceFile.timestamp : new Date(sourceFile.timestamp)
      const targetTime =
        targetFile.timestamp instanceof Date ? targetFile.timestamp : new Date(targetFile.timestamp)

      sourceTime.setMilliseconds(0)
      targetTime.setMilliseconds(0)

      if (sourceFile.size !== targetFile.size || sourceTime.getTime() !== targetTime.getTime()) {
        diffs.push({
          diffType: EDiffType.conflict,
          source: sourceFile,
          target: targetFile,
        })
      }
      // 删除已处理的目标文件
      targetMap.delete(unifyPath(sourceFile.relativePath))
    }
  })

  // 剩余在 targetMap 中的文件为仅目标端存在
  targetMap.forEach((targetFile) => {
    diffs.push({
      diffType: EDiffType.onlyTarget,
      source: null,
      target: targetFile,
    })
  })

  return diffs
}

/**
 * 将源端的文件写到目标端
 * - 如果目标文件已存在，则先删除目标端的同名文件。
 * - 然后从源端读取文件数据，并将其写入目标端。
 * - 最后将源端文件的元数据复制到目标端。
 */
async function writeFileToTarget(
  sourceFile: FileInfo,
  sourceFileSystem: FileSystem,
  targetFileSystem: FileSystem,
): Promise<void> {
  const targetFile = await targetFileSystem.exists(sourceFile.relativePath)
  if (targetFile) {
    // 如果目标文件已存在，则先删除
    await targetFileSystem.delFile(sourceFile.relativePath)
  }

  const data = await sourceFileSystem.getFileStream(sourceFile.relativePath)
  const meta = sourceFile.meta

  // 写入文件数据
  await targetFileSystem.writeFileStream(sourceFile.relativePath, data)
  // 将文件的元数据复制过去
  await targetFileSystem.setMeta(sourceFile.relativePath, meta)
}

/**
 * 通用文件同步函数
 * - 如果 diffFile.action 是 toLeft，则表示需要将目标端的文件移动到源端。
 * - 如果 diffFile.action 是 toRight，则表示需要将源端的文件移动到目标端。
 * - 如果 diffFile.action 是 ignore，则表示忽略该文件，不进行任何操作。
 * - 如果 diffFile.action 是 conflict，则表示存在冲突，需要手动处理。
 */
async function syncFile(
  diffFile: DiffFile,
  sourceFileSystem: FileSystem,
  targetFileSystem: FileSystem,
) {
  if (diffFile.action === EDiffAction.toLeft) {
    // 文件左移  target -> source
    // 如果source存在文件则先删除
    if (diffFile.source) {
      await sourceFileSystem.delFile(diffFile.source.relativePath)
    }

    // 如果target文件存在则移动到source
    if (diffFile.target) {
      const data = await targetFileSystem.getFileStream(diffFile.target.relativePath)
      const meta = diffFile.target.meta

      // 写入文件数据
      await sourceFileSystem.writeFileStream(diffFile.target.relativePath, data)
      // 将文件的元数据复制过去
      await sourceFileSystem.setMeta(diffFile.target.relativePath, meta)
    }
  } else if (diffFile.action === EDiffAction.toRight) {
    // 文件右移  source -> target
    // 如果target存在文件则先删除
    if (diffFile.target) {
      await targetFileSystem.delFile(diffFile.target.relativePath)
    }

    // 如果source文件存在则移动到target
    if (diffFile.source) {
      const data = await sourceFileSystem.getFileStream(diffFile.source.relativePath)
      const meta = diffFile.source.meta

      // 写入文件数据
      await targetFileSystem.writeFileStream(diffFile.source.relativePath, data)
      // 将文件的元数据复制过去
      await targetFileSystem.setMeta(diffFile.source.relativePath, meta)
    }
  } else {
    return
  }
}

/**
 * 获取文件系统实例对象
 */
function getFileSystemInstance(folder: FolderInfo, folderWhitelist: string[]) {
  if (folder.type === 'ftp') {
    return new FtpFileSystem(folder.ftpConfig!, folder.path, folderWhitelist)
  } else {
    return new LocalFileSystem(folder.path, folderWhitelist)
  }
}

/**
 * 根据同步类型和差异类型，返回对应的同步操作类型
 */
function getDiffAction(diffFile: DiffFile, syncType: ESyncType): EDiffAction {
  switch (syncType) {
    case ESyncType.mirror:
      return EDiffAction.toRight
    case ESyncType.twoWay:
      switch (diffFile.diffType) {
        case EDiffType.onlySource:
          return EDiffAction.toRight
        case EDiffType.onlyTarget:
          return EDiffAction.toLeft
        case EDiffType.conflict:
          return EDiffAction.conflict
        default:
          throw new Error(`未处理的 diffType:${diffFile.diffType}`)
      }
    case ESyncType.increment:
      switch (diffFile.diffType) {
        case EDiffType.onlySource:
          return EDiffAction.toRight
        case EDiffType.onlyTarget:
          return EDiffAction.ignore
        case EDiffType.conflict:
          return EDiffAction.toRight
        default:
          throw new Error(`未处理的 diffType:${diffFile.diffType}`)
      }
    default:
      throw new Error(`未处理的 syncType:${syncType}`)
  }
}

export function useSyncTool() {
  return {
    unifyPath,
    diffFileListsUnified,
    writeFileToTarget,
    syncFile,
    getFileSystemInstance,
    getDiffAction,
  }
}

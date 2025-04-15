import { FileInfo } from './FileSystem.adstract'
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
  wait = 'wait',
  success = 'success',
  error = 'error',
}

export interface DiffFile {
  diffType: EDiffType
  source: FileInfo | null
  target: FileInfo | null
  action?: EDiffAction
  status?: EDiffStatus
}

export * from './LocalFileSystem'
export * from './FtpFileSystem'

const unifyPath = (filePath: string) => {
  // 先使用 path.normalize 规范化路径（例如，将多余的“.”和“..”清理掉）
  const normalized = path.normalize(filePath)
  // 将当前平台的分隔符替换为 POSIX 的分隔符（即 '/')
  // 例如：在 Windows 上将 '\' 替换为 '/'
  return normalized.split(path.sep).join(path.posix.sep)
}

/**
 * 对比两个目录下的文件列表，返回包含差异项的统一数组，每项包含 diffType 字段
 * @param {FileInfo[]} sourceFiles - 源目录文件列表
 * @param {FileInfo[]} targetFiles - 目标目录文件列表
 * @returns {DiffFile[]} 差异项数组，每项包含 diffType 以及对应的文件信息
 */
export function diffFileListsUnified(sourceFiles: FileInfo[], targetFiles: FileInfo[]): DiffFile[] {
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

// /**
//  * 通用文件同步函数
//  * @param {string} sourceFilePath - 源文件相对于 sourceFileSystem.basePath 的路径
//  * @param {string} targetFilePath - 目标文件相对于 targetFileSystem.basePath 的路径（如果传入，则同步时先删除目标文件）
//  * @param {FileSystem} sourceFileSystem - 源文件系统实例
//  * @param {FileSystem} targetFileSystem - 目标文件系统实例
//  *
//  * 逻辑说明：
//  *   - 若 targetFilePath 有效（即目标文件存在或需要被覆盖），先删除目标文件，然后将源文件数据和元数据复制过去；
//  *   - 否则直接复制。
//  */
// export async function syncFile(sourceFilePath, targetFilePath, sourceFileSystem, targetFileSystem) {
//   try {
//     // 从源系统读取文件数据和元数据
//     const data = await sourceFileSystem.getFile(sourceFilePath)
//     const meta = await sourceFileSystem.getMeta(sourceFilePath)

//     // 如果传入了 targetFilePath，则先尝试删除目标文件（若文件不存在，则捕获异常忽略）
//     const finalTargetPath = targetFilePath || sourceFilePath
//     if (targetFilePath) {
//       try {
//         await targetFileSystem.delFile(finalTargetPath)
//         console.log(`已删除目标文件: ${finalTargetPath}`)
//       } catch (e) {
//         console.warn(`删除目标文件失败（可能不存在）: ${finalTargetPath}`)
//       }
//     }

//     // 写入文件数据到目标文件系统
//     await targetFileSystem.writeFile(finalTargetPath, data)
//     // 将源文件的元数据复制过去
//     await targetFileSystem.setMeta(finalTargetPath, meta)
//     console.log(`已同步文件 ${sourceFilePath} 到 ${finalTargetPath}`)
//   } catch (err) {
//     console.error('同步文件时发生错误:', err)
//   }
// }

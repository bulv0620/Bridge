import { FtpStorageEngine } from '../engines/FtpStorageEngine'
import { LocalStorageEngine } from '../engines/LocalStorageEngine'
import { StorageEngine } from '../engines/StorageEngine'

/**
 * 获取传输数据量
 * @param resolution
 * @param source
 * @param dest
 * @returns
 */
export function getTransferByte(
  resolution: FileSyncResolition,
  source: FileInfo | null,
  dest: FileInfo | null,
) {
  if (resolution === 'ignore') {
    return 0
  } else if (resolution === 'toLeft') {
    if (dest) {
      return dest.size
    } else {
      return 0
    }
  } else {
    if (source) {
      return source.size
    } else {
      return 0
    }
  }
}

/**
 * 根据策略获取差异项操作
 * @param sourceFlag
 * @param destFlag
 * @returns
 */
export function getResolution(
  syncStrategy: SyncStrategy,
  sourceFlag: boolean,
  destFlag: boolean,
): FileSyncResolition {
  if (syncStrategy === 'mirror') {
    return 'toRight'
  } else if (syncStrategy === 'incremental') {
    if (!sourceFlag && destFlag) {
      return 'ignore'
    } else {
      return 'toRight'
    }
  } else {
    if (sourceFlag && destFlag) {
      return 'ignore'
    } else if (!sourceFlag) {
      return 'toLeft'
    } else {
      return 'toRight'
    }
  }
}

/**
 * 根据配置获取存储引擎实例对象
 * @param config
 * @returns
 */
export function createStorageEngineInstance(config: StorageEngineConfig): StorageEngine {
  if (config.storageType === 'ftp') {
    return new FtpStorageEngine(config.connectionConfig!, config.path)
  } else {
    return new LocalStorageEngine(config.path)
  }
}

import { FtpStorageEngine } from '../impl/FtpStorageEngine'
import { S3StorageEngine } from '../impl/S3StorageEngine'
import { LocalStorageEngine } from '../impl/LocalStorageEngine'
import { StorageEngine } from '../StorageEngine'

/**
 * 根据配置获取存储引擎实例对象
 * @param config
 * @returns
 */
export function createStorageEngineInstance(config: StorageEngineConfig): StorageEngine {
  if (config.storageType === 'ftp') {
    return new FtpStorageEngine(config.connectionConfig as FtpConfig, config.path)
  } else if (config.storageType === 's3') {
    return new S3StorageEngine(config.connectionConfig as S3Config, config.path)
  } else {
    return new LocalStorageEngine(config.path)
  }
}

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

import fs from 'fs'

export interface ConfLine {
  type: 'comment' | 'blank' | 'kv'
  key?: string
  value?: string
  raw: string
}

export interface ParsedConf {
  /** 纯键值对数据 */
  data: Record<string, string | boolean | number>
  /** 原始行结构，用于保持注释与顺序 */
  lines: ConfLine[]
}

/**
 * 解析 .conf 文件为 JSON 对象
 */
export function parseConfFile(filePath: string): ParsedConf {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/)
  const parsed: ParsedConf = { data: {}, lines: [] }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      parsed.lines.push({ type: 'blank', raw: line })
      continue
    }

    if (trimmed.startsWith('#')) {
      parsed.lines.push({ type: 'comment', raw: line })
      continue
    }

    const [key, ...rest] = trimmed.split('=')
    const value = rest.join('=').trim()

    parsed.lines.push({ type: 'kv', key: key.trim(), value, raw: line })

    // 自动转类型
    let parsedValue: string | boolean | number = value
    if (value === 'true') parsedValue = true
    else if (value === 'false') parsedValue = false
    else if (!isNaN(Number(value))) parsedValue = Number(value)

    parsed.data[key.trim()] = parsedValue
  }

  return parsed
}

/**
 * 将 JSON 对象写回 .conf 文件（保持注释与原顺序）
 */
export function writeConfFile(filePath: string, conf: ParsedConf) {
  const output = conf.lines
    .map((line) => {
      if (line.type === 'kv' && line.key) {
        const newValue = conf.data[line.key]
        return `${line.key}=${newValue}`
      }
      return line.raw
    })
    .join('\n')

  fs.writeFileSync(filePath, output, 'utf-8')
}

/**
 * 更新 .conf 文件
 * @param filePath 配置文件路径
 * @param data 键值对数据
 */
export function updateConfFile(
  filePath: string,
  updates: Record<string, string | number | boolean>,
): void {
  // 1. 读取文件内容
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/)

  // 2. 解析成结构化数据
  const data: Record<string, string | number | boolean> = {}
  const lineInfo: { type: 'comment' | 'blank' | 'kv'; key?: string; raw: string }[] = []

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      lineInfo.push({ type: 'blank', raw })
      continue
    }

    if (line.startsWith('#')) {
      lineInfo.push({ type: 'comment', raw })
      continue
    }

    const [key, ...rest] = line.split('=')
    const value = rest.join('=').trim()
    data[key.trim()] = value
    lineInfo.push({ type: 'kv', key: key.trim(), raw })
  }

  // 3. 应用更新
  for (const [key, val] of Object.entries(updates)) {
    data[key] = val

    // 查找是否已存在此 key
    const line = lineInfo.find((l) => l.type === 'kv' && l.key === key)
    if (line) {
      line.raw = `${key}=${val}`
    } else {
      // 不存在则追加
      lineInfo.push({ type: 'kv', key, raw: `${key}=${val}` })
    }
  }

  // 4. 重新拼接内容
  const newContent = lineInfo.map((l) => l.raw).join('\n')

  // 5. 写回文件
  fs.writeFileSync(filePath, newContent, 'utf-8')
}

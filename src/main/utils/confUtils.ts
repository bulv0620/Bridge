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
 * 覆盖写入 .conf 文件
 * @param filePath 配置文件路径
 * @param data 键值对数据
 */
export function writeConfFile(
  filePath: string,
  data: Record<string, string | number | boolean>,
): void {
  const lines: string[] = []

  for (const [key, value] of Object.entries(data)) {
    lines.push(`${key}=${value}`)
  }

  const content = lines.join('\n')
  fs.writeFileSync(filePath, content, 'utf-8')
}

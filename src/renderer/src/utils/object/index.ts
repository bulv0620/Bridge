/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的新对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // 处理Date对象
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const copy: any[] = []
    obj.forEach((item) => {
      copy.push(deepClone(item))
    })
    return copy as any
  }

  // 处理普通对象
  if (obj instanceof Object) {
    const copy: { [key: string]: any } = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepClone(obj[key])
      }
    }
    return copy as T
  }

  // 处理其他类型
  return obj
}

/**
 * 深度比较两个对象是否一致
 * @param obj1 第一个对象
 * @param obj2 第二个对象
 * @returns 是否一致
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  // 处理基本类型
  if (obj1 === obj2) return true

  // 处理null或undefined
  if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false
  }

  // 处理Date对象
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime()
  }

  // 处理数组
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false
    }
    return true
  }

  // 处理普通对象
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false
    }
  }

  return true
}

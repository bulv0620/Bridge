import { Aria2GlobalOption, Aria2GlobalStat, Aria2Status } from './Aria2Types'

interface Aria2Options {
  /**
   * aria2 RPC 服务的完整地址，例如：http://localhost:6800/jsonrpc
   */
  url: string
  /**
   * 如果你的 aria2 RPC 启用了 token 验证，在这里设置（不需要加 'token:' 前缀）
   */
  token?: string
}

interface Aria2Request {
  jsonrpc: '2.0'
  id: string
  method: string
  params: any[]
}

export class Aria2Client {
  public url: string
  private token?: string

  constructor(options: Aria2Options) {
    this.url = options.url
    this.token = options.token
  }

  /**
   * 获取url信息
   */
  getUrl() {
    return this.url
  }

  /**
   * 向 aria2 发送通用 JSON-RPC 请求（带超时控制）
   */
  async rpcRequest(method: string, params: any[] = []): Promise<any> {
    const rpc: Aria2Request = {
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method,
      params: this.token ? [`token:${this.token}`, ...params] : params,
    }

    // 设置请求超时时间为 10 秒
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rpc),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Aria2 RPC HTTP 错误: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        const { code, message } = data.error
        throw new Error(`Aria2 RPC 错误 ${code}: ${message}`)
      }

      return data.result
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * 测试与 aria2 RPC 的连接是否正常
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.rpcRequest('aria2.getVersion')
      return true
    } catch {
      return false
    }
  }

  /**
   * 添加一个新的下载任务（通过 URI）
   */
  addUri(uris: string[], options: Record<string, any> = {}): Promise<string> {
    return this.rpcRequest('aria2.addUri', [uris, options])
  }

  /**
   * 删除一个任务（同时停止并从队列中移除）
   */
  remove(gid: string): Promise<string> {
    return this.rpcRequest('aria2.remove', [gid])
  }

  /**
   * 从 aria2 的内存中移除下载结果（不会删除文件）
   */
  removeDownloadResult(gid: string): Promise<string> {
    return this.rpcRequest('aria2.removeDownloadResult', [gid])
  }

  /**
   * 暂停一个下载任务
   */
  pause(gid: string): Promise<string> {
    return this.rpcRequest('aria2.pause', [gid])
  }

  /**
   * 恢复一个暂停的下载任务
   */
  unpause(gid: string): Promise<string> {
    return this.rpcRequest('aria2.unpause', [gid])
  }

  /**
   * 获取某个任务的状态信息
   */
  tellStatus(gid: string, keys: string[] = []): Promise<Aria2Status> {
    return this.rpcRequest('aria2.tellStatus', [gid, keys])
  }

  /**
   * 获取正在下载的任务列表
   */
  tellActive(keys: string[] = []): Promise<Aria2Status[]> {
    return this.rpcRequest('aria2.tellActive', [keys])
  }

  /**
   * 获取等待中的任务列表
   * @param offset 起始位置
   * @param num 返回的任务数量
   */
  tellWaiting(offset: number, num: number, keys: string[] = []): Promise<Aria2Status[]> {
    return this.rpcRequest('aria2.tellWaiting', [offset, num, keys])
  }

  /**
   * 获取已停止（完成/出错/已删除）的任务列表
   * @param offset 起始位置
   * @param num 返回的任务数量
   */
  tellStopped(offset: number, num: number, keys: string[] = []): Promise<Aria2Status[]> {
    return this.rpcRequest('aria2.tellStopped', [offset, num, keys])
  }

  /**
   * 修改全局配置选项，如最大同时下载数等
   */
  changeGlobalOption(options: Partial<Aria2GlobalOption>): Promise<Record<string, any>> {
    return this.rpcRequest('aria2.changeGlobalOption', [options])
  }

  /**
   * 获取当前的全局配置项
   */
  getGlobalOption(): Promise<Aria2GlobalOption> {
    return this.rpcRequest('aria2.getGlobalOption')
  }

  /**
   * 获取全局下载/上传速度等统计信息
   */
  getGlobalStat(): Promise<Aria2GlobalStat> {
    return this.rpcRequest('aria2.getGlobalStat')
  }

  /**
   * 关闭 aria2 服务（正常关闭）
   */
  shutdown(): Promise<void> {
    return this.rpcRequest('aria2.shutdown')
  }

  /**
   * 强制关闭 aria2 服务
   */
  forceShutdown(): Promise<void> {
    return this.rpcRequest('aria2.forceShutdown')
  }
}

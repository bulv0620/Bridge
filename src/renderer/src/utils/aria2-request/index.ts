interface Aria2Options {
  /**
   * The full URL of the aria2 RPC service, e.g., http://localhost:6800/jsonrpc
   */
  url: string
  /**
   * If your aria2 RPC service is secured with a secret token, set it here (without the 'token:' prefix)
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
  private url: string
  private token?: string

  constructor(options: Aria2Options) {
    this.url = options.url
    this.token = options.token
  }

  /**
   * Generic JSON-RPC request to aria2
   */
  private async rpcRequest(method: string, params: any[] = []): Promise<any> {
    const rpc: Aria2Request = {
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method,
      params: this.token ? [`token:${this.token}`, ...params] : params,
    }

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpc),
    })

    if (!response.ok) {
      throw new Error(`Aria2 RPC HTTP error: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    if (data.error) {
      const { code, message } = data.error
      throw new Error(`Aria2 RPC error ${code}: ${message}`)
    }
    return data.result
  }

  /**
   * Add a new download by URI(s)
   */
  addUri(uris: string[], options: Record<string, any> = {}): Promise<string> {
    return this.rpcRequest('aria2.addUri', [uris, options])
  }

  /**
   * Remove a download (stop and delete from queue)
   */
  remove(gid: string): Promise<string> {
    return this.rpcRequest('aria2.remove', [gid])
  }

  /**
   * Pause a download
   */
  pause(gid: string): Promise<string> {
    return this.rpcRequest('aria2.pause', [gid])
  }

  /**
   * Resume a paused download
   */
  unpause(gid: string): Promise<string> {
    return this.rpcRequest('aria2.unpause', [gid])
  }

  /**
   * Tell status of a specific download
   */
  tellStatus(gid: string, keys: string[] = []): Promise<Record<string, any>> {
    return this.rpcRequest('aria2.tellStatus', [gid, keys])
  }

  /**
   * Get a list of active downloads
   */
  tellActive(keys: string[] = []): Promise<Record<string, any>[]> {
    return this.rpcRequest('aria2.tellActive', [keys])
  }

  /**
   * Get a list of waiting downloads
   * @param offset Start position
   * @param num Number of entries
   */
  tellWaiting(offset: number, num: number, keys: string[] = []): Promise<Record<string, any>[]> {
    return this.rpcRequest('aria2.tellWaiting', [offset, num, keys])
  }

  /**
   * Get a list of stopped downloads
   * @param offset Start position
   * @param num Number of entries
   */
  tellStopped(offset: number, num: number, keys: string[] = []): Promise<Record<string, any>[]> {
    return this.rpcRequest('aria2.tellStopped', [offset, num, keys])
  }

  /**
   * Change global options, e.g., max-concurrent-downloads
   */
  changeGlobalOption(options: Record<string, any>): Promise<Record<string, any>> {
    return this.rpcRequest('aria2.changeGlobalOption', [options])
  }

  /**
   * Get global options
   */
  getGlobalOption(): Promise<Record<string, any>> {
    return this.rpcRequest('aria2.getGlobalOption')
  }

  /**
   * Shutdown the aria2 server
   */
  shutdown(): Promise<void> {
    return this.rpcRequest('aria2.shutdown')
  }

  /**
   * Force shutdown the aria2 server
   */
  forceShutdown(): Promise<void> {
    return this.rpcRequest('aria2.forceShutdown')
  }
}

// Example usage:
// const client = new Aria2Client({ url: 'http://localhost:6800/jsonrpc', token: 'mysecret' });
// client.addUri(['https://example.com/file.iso']).then(gid => console.log('Download started with GID:', gid));

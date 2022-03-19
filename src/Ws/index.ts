/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { WsContract, WsConfig } from '@ioc:Ruby184/Socket.IO/Ws'
import { Server as IoServer } from 'socket.io'
import { WsNamespace } from './WsNamespace'
import { Store } from './Store'
import { MiddlewareStore } from '../MiddlewareStore'
import { PreCompiler } from './PreCompiler'
import { HandlerExecutor } from './HandlerExecutor'

export class WsServer implements WsContract {
  private attached: boolean = false

  public io = new IoServer()

  public middleware = new MiddlewareStore(this.application.container)

  public namespaces: { [pattern: string]: WsNamespace } = {}

  private store = new Store()

  private precompiler = new PreCompiler(this.application.container, this.middleware)

  private executor = new HandlerExecutor(this.application, this.precompiler, this.store, this.io)

  public WsNamespace = WsNamespace

  constructor(private application: ApplicationContract, private socketConfig: WsConfig) {}

  private normalizeNamespace(ns: string): string {
    if (ns === '/') {
      return '/'
    }

    return `/${ns.replace(/^\//, '').replace(/\/$/, '')}`
  }

  public namespace(pattern: string): WsNamespace {
    const nsp = this.normalizeNamespace(pattern)

    if (!this.namespaces[nsp]) {
      this.namespaces[nsp] = new WsNamespace(nsp)
    }

    return this.namespaces[nsp]
  }

  public commit() {
    Object.values(this.namespaces).forEach((namespace) => {
      const nsp = namespace.toJSON()
      this.precompiler.compileNamespace(nsp)
      this.store.add(nsp)
    })

    this.namespaces = {}
  }

  public async attach(): Promise<void> {
    this.commit()
    this.attached = this.executor.attach(this.socketConfig)
  }

  public async close(): Promise<void> {
    if (!this.attached) {
      return
    }

    return new Promise((resolve, reject) => {
      this.io.close((err) => (err ? reject(err) : resolve()))
    })
  }
}

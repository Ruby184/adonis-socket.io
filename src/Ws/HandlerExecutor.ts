/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { ErrorHandler, MatchedNamespace, WsConfig } from '@ioc:Ruby184/Socket.IO/Ws'
import type { WsContextContract, WsSocket } from '@ioc:Ruby184/Socket.IO/WsContext'
import type { Namespace, Server, Socket } from 'socket.io'
import type { PreCompiler } from './PreCompiler'
import type { Store } from './Store'
import { ExceptionManager } from '../ExceptionManager'

export class HandlerExecutor {
  /**
   * Exception manager to handle exceptions
   */
  private exception = new ExceptionManager(this.application.container)

  /**
   * Resolve bindings required for creating context from container
   */
  private Server = this.application.container.resolveBinding('Adonis/Core/Server')
  private Request = this.application.container.resolveBinding('Adonis/Core/Request')
  private Response = this.application.container.resolveBinding('Adonis/Core/Response')
  private WsContext = this.application.container.resolveBinding('Ruby184/Socket.IO/WsContext')
  private encryption = this.application.container.resolveBinding('Adonis/Core/Encryption')

  protected nsp: Namespace | null = null

  constructor(
    private application: ApplicationContract,
    private precompiler: PreCompiler,
    private store: Store,
    private io: Server
  ) {}

  private getContext(socket: Socket, matched: MatchedNamespace): WsContextContract {
    // TODO: we should not create and use response, but return Proxy to intercept and throw error when user tries to use response
    const request = new this.Request(
      socket.request,
      socket.request['res'],
      this.encryption,
      this.Server['httpConfig']
    )

    const response = new this.Response(
      socket.request,
      socket.request['res'],
      this.encryption,
      this.Server['httpConfig'],
      this.Server.router
    )

    const data = { namespace: socket.nsp.name, socket_id: socket.id }

    const ctx = new this.WsContext(
      request,
      response,
      this.application.logger.child(data),
      this.application.profiler.create('ws:connection', data),
      socket
    )

    ctx.namespace = matched.namespace
    ctx.params = matched.params
    // TODO: just here for compatibility with http context
    ctx.routeKey = socket.nsp.name
    ctx.request.updateParams(ctx.params)

    return ctx
  }

  private handleConnection = (socket: WsSocket) => {
    const ctx: WsContextContract = socket.ctx!

    for (const evt of ['disconnecting', 'disconnect'] as const) {
      if (ctx.namespace.meta.resolvedHandlers![evt]) {
        socket.on(evt, async (reason: string) => {
          try {
            await this.precompiler.runConnectionHandler(evt, ctx, reason)
          } catch (error) {
            await this.exception.handle(error, ctx)
          }
        })
      }
    }

    socket.onAny(async (event, ...args) => {
      const ack: (error: Error | null, response: any) => void =
        args.length > 0 && typeof args[args.length - 1] === 'function' ? args.pop() : () => {}

      try {
        ack(null, await this.precompiler.runEventHandler(event, ctx, args))
      } catch (error) {
        ack(await this.exception.handle(error, ctx), null)
      }
    })

    socket.on('error', async (error) => {
      await this.exception.handle(error, ctx)
    })
  }

  private addMiddlewareToNamespace = (namespace: Namespace) => {
    const matched = this.store.match(namespace.name)

    if (!matched) {
      return
    }

    namespace.use(async (socket, next) => {
      const ctx = this.getContext(socket, matched)

      try {
        await this.precompiler.runNamespaceMiddleware(ctx)
        next()
      } catch (error) {
        next(await this.exception.handle(error, ctx))
      }
    })

    namespace.on('connect', this.handleConnection)
  }

  public attach(socketConfig: WsConfig, exceptionHandler?: ErrorHandler): boolean {
    if (!this.Server.instance) {
      return false
    }

    if (exceptionHandler) {
      this.exception.registerHandler(exceptionHandler)
    }

    // first define static namespaces to socket.io
    for (const nsp of this.store.statics()) {
      this.addMiddlewareToNamespace(this.io.of(nsp))
    }

    // add checking of dynamic namespaces
    this.nsp = this.io.of((name, _, next) => next(null, this.store.isDynamic(name)))

    // when new dynamic namespace is created add middleware to it
    this.io.on('new_namespace', this.addMiddlewareToNamespace)

    // finally attach socket.io to adonis http server
    this.io.attach(this.Server.instance, socketConfig)

    return true
  }
}

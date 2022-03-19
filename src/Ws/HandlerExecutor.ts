/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { MatchedNamespace, WsConfig } from '@ioc:Ruby184/Socket.IO/Ws'
import type { WsContextContract, WsSocket } from '@ioc:Ruby184/Socket.IO/WsContext'
import type { Namespace, Server, Socket } from 'socket.io'
import type { PreCompiler } from './PreCompiler'
import type { Store } from './Store'

export class HandlerExecutor {
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

  // TODO: handling of errors
  private handleConnection = (socket: WsSocket) => {
    const ctx: WsContextContract = socket.ctx!

    if (ctx.namespace.meta.resolvedHandlers!.disconnecting) {
      socket.on('disconnecting', (reason: string) => {
        this.precompiler.runConnectionHandler('disconnecting', ctx, reason)
      })
    }

    socket.onAny((event, ...args) => {
      this.precompiler.runEventHandler(event, ctx, args)
    })
  }

  // TODO: extract this to dedicated exception handler to report and handle
  private toExtendedError(error: any): Error & { data: any } {
    if (error.data) {
      return error
    }

    error.data = {
      code: error.code || 'E_UNKNOWN',
      status: error.status || 500,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    }

    return error
  }

  private handleNewNamespace = (namespace: Namespace) => {
    const matched = this.store.match(namespace.name)

    namespace.use(async (socket, next) => {
      try {
        await this.precompiler.runNamespaceMiddleware(this.getContext(socket, matched!))
        next()
      } catch (err) {
        next(this.toExtendedError(err))
      }
    })
  }

  public attach(socketConfig: WsConfig): void {
    if (!this.Server.instance) {
      return
    }

    // if we have root namespace defined attach handlers
    if (this.store.check('/')) {
      this.handleNewNamespace(this.io.of('/').on('connection', this.handleConnection))
    }

    // add checking of dynamic namespaces and handling for new connections
    this.nsp = this.io
      .of((name, _, next) => next(null, this.store.check(name)))
      .on('connection', this.handleConnection)

    // when new dynamic namespace is created add middleware
    this.io.on('new_namespace', this.handleNewNamespace)

    this.io.attach(this.Server.instance, socketConfig)
  }
}

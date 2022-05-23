/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { NamespaceJSON } from '@ioc:Ruby184/Socket.IO/Ws'
import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import type {
  ResolvedMiddlewareHandler,
  WsMiddlewareStoreContract,
} from '@ioc:Ruby184/Socket.IO/MiddlewareStore'
import type { IocContract, IocResolverContract } from '@ioc:Adonis/Core/Application'
import haye from 'haye'
import { Middleware } from 'co-compose'
import { Exception } from '@poppinss/utils'

export class PreCompiler {
  /**
   * The resolver used to resolve the controllers from IoC container
   */
  private resolver: IocResolverContract<any>

  /**
   * Method to execute middleware using the middleware store
   */
  private executeMiddleware = (
    middleware: ResolvedMiddlewareHandler,
    params: [WsContextContract, () => Promise<void>]
  ) => {
    return this.middlewareStore.invokeMiddleware(middleware, params)
  }

  /**
   * Method to execute handler for connection, disconnect or disconnecting events
   */
  public runConnectionHandler = (
    event: 'connection' | 'disconnect' | 'disconnecting',
    ctx: WsContextContract,
    reason?: any
  ) => {
    const routeHandler = ctx.namespace.meta.resolvedHandlers![event]!

    if (routeHandler.type === 'function') {
      return routeHandler.handler(ctx, reason)
    }

    return this.resolver.call(routeHandler, undefined, [ctx].concat(reason))
  }

  constructor(container: IocContract, private middlewareStore: WsMiddlewareStoreContract) {
    this.resolver = container.getResolver(undefined, 'wsControllers', 'App/Controllers/Ws')
  }

  private compileHandlers(nsp: NamespaceJSON) {
    nsp.meta.resolvedHandlers = {}

    for (const [event, handler] of Object.entries(nsp.handlers)) {
      if (typeof handler === 'string') {
        nsp.meta.resolvedHandlers[event] = this.resolver.resolve(handler, nsp.meta.namespace)
      } else if (handler) {
        nsp.meta.resolvedHandlers[event] = { type: 'function', handler }
      }
    }
  }

  private compileMiddleware(nsp: NamespaceJSON) {
    const list = nsp.middleware.map((item) => {
      if (typeof item === 'function') {
        return { type: 'function', value: item, args: [] }
      }

      /*
       * Extract middleware name and args from the string
       */
      const [{ name, args }] = haye.fromPipe(item).toArray()
      const resolvedMiddleware = this.middlewareStore.getNamed(name)

      if (!resolvedMiddleware) {
        throw new Exception(
          `Cannot find a ws middleware named "${name}"`,
          500,
          'E_MISSING_NAMED_WS_MIDDLEWARE'
        )
      }

      return { ...resolvedMiddleware, args }
    })

    nsp.meta.resolvedMiddleware = new Middleware()
      .register(this.middlewareStore.get())
      .register(list)
  }

  public compileNamespace(nsp: NamespaceJSON) {
    this.compileHandlers(nsp)
    this.compileMiddleware(nsp)
  }

  /**
   * Method to run middleware chain for given namespace
   */
  public async runNamespaceMiddleware(ctx: WsContextContract) {
    const runner = ctx.namespace.meta.resolvedMiddleware!.runner().executor(this.executeMiddleware)

    if (ctx.namespace.meta.resolvedHandlers!.connection) {
      runner.finalHandler(this.runConnectionHandler, ['connection', ctx])
    }

    return runner.run([ctx])
  }

  /**
   * Method to run event handler with given args
   */
  public async runEventHandler(event: string, ctx: WsContextContract, args: any[]) {
    const routeHandler = ctx.namespace.meta.resolvedHandlers![event]

    if (typeof routeHandler === 'undefined') {
      throw new Exception(
        `Cannot find a handler for event "${event}" in namespace "${ctx.namespace.pattern}"`,
        500,
        'E_MISSING_EVENT_HANDLER'
      )
    }

    if (routeHandler.type === 'function') {
      return routeHandler.handler(ctx, ...args)
    }

    return this.resolver.call(routeHandler, undefined, [ctx].concat(args))
  }
}

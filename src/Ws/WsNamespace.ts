/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type {
  ConnectHandler,
  DisconnectHandler,
  EventHandler,
  NamespaceHandlers,
  NamespaceJSON,
  NamespaceMatchersNode,
  NamespaceMiddlewareHandler,
  NamespaceParamMatcher,
  WsNamespaceContract,
} from '@ioc:Ruby184/Socket.IO/Ws'

import { types } from '@poppinss/utils/build/helpers'
import { Macroable } from 'macroable'

export class WsNamespace extends Macroable implements WsNamespaceContract {
  protected static macros = {}
  protected static getters = {}

  /**
   * An object of matchers to be forwarded to the
   * store. The matchers list is populated by
   * calling `where` method
   */
  private matchers: NamespaceMatchersNode = {}

  private handlers: NamespaceHandlers = {}

  private middlewares: NamespaceMiddlewareHandler[][] = []

  constructor(private pattern: string, private globalMatchers: NamespaceMatchersNode) {
    super()
  }

  public static normalize(ns: string): string {
    if (ns === '/') {
      return '/'
    }

    return `/${ns.replace(/^\//, '').replace(/\/$/, '')}`
  }

  /**
   * Returns an object of param matchers by merging global and local
   * matchers. The local copy is given preference over the global
   * one's
   */
  private getMatchers(): NamespaceMatchersNode {
    return Object.assign({}, this.globalMatchers, this.matchers)
  }

  private addHandler(
    event: string,
    handler: EventHandler | ConnectHandler | DisconnectHandler
  ): this {
    if (this.handlers[event]) {
      throw new Error('Duplicate event handler')
    }

    this.handlers[event] = handler
    return this
  }

  public where(param: string, matcher: NamespaceParamMatcher): this {
    if (typeof matcher === 'string') {
      this.matchers[param] = { match: new RegExp(matcher) }
    } else if (types.isRegexp(matcher)) {
      this.matchers[param] = { match: matcher }
    } else {
      this.matchers[param] = matcher
    }

    return this
  }

  public on(event: string, handler: EventHandler): this {
    return this.addHandler(event, handler)
  }

  public middleware(middleware: NamespaceMiddlewareHandler | NamespaceMiddlewareHandler[]): this {
    this.middlewares.push(Array.isArray(middleware) ? middleware : [middleware])
    return this
  }

  public connected(handler: ConnectHandler): this {
    return this.addHandler('connection', handler)
  }

  public disconnecting(handler: DisconnectHandler): this {
    return this.addHandler('disconnecting', handler)
  }

  public disconnected(handler: DisconnectHandler): this {
    return this.addHandler('disconnect', handler)
  }

  public toJSON(): NamespaceJSON {
    return {
      pattern: this.pattern,
      handlers: this.handlers,
      matchers: this.getMatchers(),
      middleware: this.middlewares.flat(),
      meta: {},
    }
  }
}

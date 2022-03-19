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
  NamespaceMiddlewareHandler,
  NamespaceNode,
  WsNamespaceContract,
} from '@ioc:Ruby184/Socket.IO/Ws'
import { Macroable } from 'macroable'

export class WsNamespace extends Macroable implements WsNamespaceContract {
  protected static macros = {}
  protected static getters = {}

  private handlers: NamespaceHandlers = {}

  private middlewares: NamespaceMiddlewareHandler[][] = []

  constructor(private pattern: string) {
    super()
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

  public disconnected(handler: DisconnectHandler): this {
    return this.addHandler('disconnecting', handler)
  }

  public toJSON(): NamespaceNode {
    return {
      pattern: this.pattern,
      handlers: this.handlers,
      middleware: this.middlewares.flat(),
      meta: {},
    }
  }
}

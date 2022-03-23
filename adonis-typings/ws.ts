/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Ruby184/Socket.IO/Ws' {
  import { Server as IoServer, ServerOptions } from 'socket.io'
  import { MacroableConstructorContract } from 'macroable'
  import { Middleware } from 'co-compose'
  import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
  import {
    FunctionMiddlewareHandler,
    WsMiddlewareStoreContract,
  } from '@ioc:Ruby184/Socket.IO/MiddlewareStore'

  export type EventHandler = ((ctx: WsContextContract, ...data: any[]) => any) | string
  export type ConnectHandler = ((ctx: WsContextContract) => any) | string
  export type DisconnectHandler = ((ctx: WsContextContract, reason: string) => any) | string
  export type NamespaceMiddlewareHandler = FunctionMiddlewareHandler | string
  export type ResolvedEventHandler =
    | {
        type: 'function'
        handler: Exclude<EventHandler, string>
      }
    | {
        type: 'alias' | 'binding'
        namespace: string
        method: string
      }

  export type NamespaceHandlers = Partial<{
    connection: ConnectHandler
    disconnect: DisconnectHandler
    disconnecting: DisconnectHandler
    [event: string]: EventHandler
  }>

  export type NamespaceNode = {
    pattern: string
    handlers: NamespaceHandlers
    middleware: NamespaceMiddlewareHandler[]
    meta: {
      resolvedHandlers?: { [event: string]: ResolvedEventHandler }
      resolvedMiddleware?: Middleware
      namespace?: string
    } & Record<string, any>
  }

  export type NamespacesTree = {
    tokens: any[]
    namespaces: {
      [pattern: string]: NamespaceNode
    }
  }

  export type MatchedNamespace = {
    namespace: NamespaceNode
    params: Record<string, any>
  }

  export interface WsNamespaceContract {
    on(event: string, handler: EventHandler): this
    middleware(middleware: NamespaceMiddlewareHandler | NamespaceMiddlewareHandler[]): this
    connected(handler: ConnectHandler): this
    disconnecting(handler: DisconnectHandler): this
    disconnected(handler: DisconnectHandler): this
  }

  export interface WsNamespaceConstructorContract
    extends MacroableConstructorContract<WsNamespaceContract> {
    new (pattern: string): WsNamespaceContract
  }

  export interface WsContract {
    /**
     * Exposing WsNamespace constructor to be extended from outside
     */
    WsNamespace: WsNamespaceConstructorContract

    /**
     * Reference to original socket.io server
     */
    io: IoServer

    /**
     * The middleware store to register global and named middleware
     */
    middleware: WsMiddlewareStoreContract

    namespace(name: string): WsNamespaceContract

    attach(): Promise<void>
    close(): Promise<void>
  }

  export interface WsConfig extends Partial<ServerOptions> {}

  const WsServer: WsContract
  export default WsServer
}

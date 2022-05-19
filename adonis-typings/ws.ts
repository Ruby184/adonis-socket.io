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
  import {
    RouteParamMatcher,
    RouteMatchersNode,
    RouteMatchersContract,
  } from '@ioc:Adonis/Core/Route'

  export type EventHandler = ((ctx: WsContextContract, ...data: any[]) => any) | string
  export type ConnectHandler = ((ctx: WsContextContract) => any) | string
  export type DisconnectHandler = ((ctx: WsContextContract, reason: string) => any) | string
  export type NamespaceMiddlewareHandler = FunctionMiddlewareHandler | string
  export type ResolvedHandler<T> =
    | {
        type: 'function'
        handler: Exclude<T, string>
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
      resolvedHandlers?: {
        [Key in keyof NamespaceHandlers]:
          | ResolvedHandler<Exclude<NamespaceHandlers[Key], undefined>>
          | undefined
      }
      resolvedMiddleware?: Middleware
      namespace?: string
    } & Record<string, any>
  }

  export type NamespaceParamMatcher = RouteParamMatcher
  export interface NamespaceMatchersNode extends RouteMatchersNode {}

  export type NamespaceJSON = NamespaceNode & {
    matchers: NamespaceMatchersNode
  }

  export type NamespacesTree = {
    tokens: any[]
    static: {
      [pattern: string]: NamespaceNode
    }
    dynamic: {
      [pattern: string]: NamespaceNode
    }
  }

  export type MatchedNamespace = {
    namespace: NamespaceNode
    params: Record<string, any>
  }

  /**
   * Shape of websocket namespace class
   */
  export interface WsNamespaceContract {
    /**
     * Define Regex matcher for a given param.
     */
    where(param: string, matcher: NamespaceParamMatcher): this

    /**
     * Define controller namespace for a given socket.io namespace.
     */
    namespace(namespace: string): this

    /**
     * Define event handler which is executed on given event for namespace.
     */
    on(event: string, handler: EventHandler): this

    /**
     * Define an array of middleware to be executed on the namespace.
     */
    middleware(middleware: NamespaceMiddlewareHandler | NamespaceMiddlewareHandler[]): this

    /**
     * Define a handler which is executed after connected socket passed
     * through the namespace middleware.
     */
    connected(handler: ConnectHandler): this

    /**
     * Define a handler which is executed on socket disconnect before it left the rooms.
     * This is the same as listening on the `disconnecting` event when using socket.io.
     * https://socket.io/docs/v4/server-socket-instance/#disconnecting
     */
    disconnecting(handler: DisconnectHandler): this

    /**
     * Define a handler which is executed on socket disconnect after it left the rooms.
     * This is the same as listening on the `disconnect` event when using socket.io.
     * https://socket.io/docs/v4/server-socket-instance/#disconnect
     */
    disconnected(handler: DisconnectHandler): this

    /**
     * Returns serialized [[NamespaceDefinition]] that can be passed to the [[Store]]
     * for registering the namespace.
     */
    toJSON(): NamespaceJSON
  }

  export interface WsNamespaceConstructorContract
    extends MacroableConstructorContract<WsNamespaceContract> {
    new (pattern: string, globalMatchers: NamespaceMatchersNode): WsNamespaceContract
    normalize(pattern: string): string
  }

  export interface NamespaceMatchersContract extends RouteMatchersContract {}

  export interface NamespaceMatchersConstructorContract
    extends MacroableConstructorContract<NamespaceMatchersContract> {
    new (): NamespaceMatchersContract
  }

  export interface WsContract {
    /**
     * Exposing WsNamespace and NamespaceMatchers constructors to be extended from outside
     */
    WsNamespace: WsNamespaceConstructorContract
    NamespaceMatchers: NamespaceMatchersConstructorContract

    /**
     * Reference to the original socket.io server
     */
    io: IoServer

    /**
     * The middleware store to register global and named middleware
     */
    middleware: WsMiddlewareStoreContract

    /**
     * Shortcut methods for commonly used matchers (extending the route matchers from adonis router)
     */
    matchers: NamespaceMatchersContract

    /**
     * Define a namespace with given name or pattern
     */
    namespace(name: string): WsNamespaceContract

    /**
     * Define global namespace matcher
     */
    where(key: string, matcher: NamespaceParamMatcher): this

    attach(): Promise<void>
    close(): Promise<void>
  }

  export interface WsConfig extends Partial<ServerOptions> {}

  const WsServer: WsContract
  export default WsServer
}

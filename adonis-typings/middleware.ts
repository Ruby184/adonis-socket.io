/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Ruby184/Socket.IO/MiddlewareStore' {
  import { DefaultExport } from '@ioc:Adonis/Core/Middleware'
  import { IocContract } from '@ioc:Adonis/Core/Application'
  import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
  /**
   * Shape of the middleware class
   */
  export interface WsMiddlewareConstructorContract {
    new (...args: any[]): {
      wsHandle(ctx: WsContextContract, next: () => any, ...options: any[]): any
    }
  }

  export type LazyImportMiddlewareHandler = () => DefaultExport<WsMiddlewareConstructorContract>
  export type FunctionMiddlewareHandler = (
    ctx: WsContextContract,
    next: () => void,
    ...options: any[]
  ) => any

  /**
   * Input middleware node must be function or a string pointing
   * to the IoC container
   */
  export type MiddlewareHandler = string | LazyImportMiddlewareHandler | FunctionMiddlewareHandler

  /**
   * Shape of resolved middleware. This information is
   * enough to execute the middleware
   */
  export type ResolvedMiddlewareHandler =
    | {
        type: 'function'
        value: FunctionMiddlewareHandler
        args: string[]
      }
    | {
        type: 'lazy-import'
        value: LazyImportMiddlewareHandler
        args: string[]
      }
    | {
        type: 'alias' | 'binding'
        namespace: string
        method: string
        args: string[]
      }
  /**
   * Shape of middleware store to store and fetch middleware
   * at runtime
   */
  export interface WsMiddlewareStoreContract {
    /**
     * Register an array of global middleware. These middleware are read
     * by HTTP server and executed on every request
     */
    register(middleware: MiddlewareHandler[]): this
    /**
     * Register named middleware that can be referenced later on routes
     */
    registerNamed(middleware: { [alias: string]: MiddlewareHandler }): this
    /**
     * Return all middleware registered using [[MiddlewareStore.register]]
     * method
     */
    get(): ResolvedMiddlewareHandler[]
    /**
     * Removes all the global middleware
     */
    clear(): void
    /**
     * Removes all/select named middleware
     */
    clearNamed(names: string[]): void
    /**
     * Returns a single middleware by it's name registered
     * using [[MiddlewareStore.registerNamed]] method.
     */
    getNamed(name: string): null | ResolvedMiddlewareHandler
    /**
     * Invokes a resolved middleware.
     */
    invokeMiddleware(
      middleware: ResolvedMiddlewareHandler,
      params: [WsContextContract, () => Promise<void>]
    ): Promise<void>
  }
  /**
   * The shape of the middleware store constructor. We default export the
   * constructor, since the store instance must be pulled from the
   * server to register/fetch middleware
   */
  export interface WsMiddlewareStoreConstructorContract {
    new (container: IocContract): WsMiddlewareStoreContract
  }

  const MiddlewareStore: WsMiddlewareStoreConstructorContract
  export default MiddlewareStore
}

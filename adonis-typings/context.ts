/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Ruby184/Socket.IO/WsContext' {
  import { NamespaceNode } from '@ioc:Ruby184/Socket.IO/Ws'
  import { HttpContextContract, HttpContextConstructorContract } from '@ioc:Adonis/Core/HttpContext'
  import { LoggerContract } from '@ioc:Adonis/Core/Logger'
  import { RequestContract } from '@ioc:Adonis/Core/Request'
  import { ResponseContract } from '@ioc:Adonis/Core/Response'
  import { ProfilerRowContract } from '@ioc:Adonis/Core/Profiler'
  import { Socket } from 'socket.io'

  export interface WsSocket extends Socket {
    ctx?: WsContextContract
  }

  /**
   * WS connection context passed to all middlewares and emitted events
   */
  export interface WsContextContract
    extends Omit<HttpContextContract, 'response' | 'route' | 'subdomains'> {
    socket: WsSocket
    namespace: NamespaceNode
  }

  /**
   * Shape of the constructor. We export the constructor and not
   * the context instance, since that is passed to the HTTP
   * lifecycle
   */
  export interface WsContextConstructorContract extends HttpContextConstructorContract {
    new (
      request: RequestContract,
      response: ResponseContract,
      logger: LoggerContract,
      profiler: ProfilerRowContract,
      socket: WsSocket
    ): WsContextContract
  }

  const WsContext: WsContextConstructorContract
  export default WsContext
}

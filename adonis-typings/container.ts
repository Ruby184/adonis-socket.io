/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Application' {
  import { WsContract } from '@ioc:Ruby184/Socket.IO/Ws'
  import { WsContextConstructorContract } from '@ioc:Ruby184/Socket.IO/WsContext'
  import { WsMiddlewareStoreConstructorContract } from '@ioc:Ruby184/Socket.IO/MiddlewareStore'
  import WsExceptionHandler from '@ioc:Ruby184/Socket.IO/WsExceptionHandler'

  export interface ContainerBindings {
    'Ruby184/Socket.IO/Ws': WsContract
    'Ruby184/Socket.IO/WsContext': WsContextConstructorContract
    'Ruby184/Socket.IO/MiddlewareStore': WsMiddlewareStoreConstructorContract
    'Ruby184/Socket.IO/WsExceptionHandler': typeof WsExceptionHandler
  }
}

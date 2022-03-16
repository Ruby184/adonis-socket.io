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

  export interface ContainerBindings {
    'Ruby184/Socket.IO/Ws': WsContract
  }
}

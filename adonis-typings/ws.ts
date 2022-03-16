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

  export interface WsContract {
    io: IoServer
    attach(): Promise<void>
    close(): Promise<void>
  }

  export interface WsConfig extends Partial<ServerOptions> {}

  const WsServer: WsContract
  export default WsServer
}

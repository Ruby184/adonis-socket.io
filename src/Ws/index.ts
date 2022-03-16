/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ServerContract } from '@ioc:Adonis/Core/Server'
import type { WsContract, WsConfig } from '@ioc:Ruby184/Socket.IO/Ws'
import { Server as IoServer } from 'socket.io'

export class WsServer implements WsContract {
  public io = new IoServer()

  constructor(private Server: ServerContract, private socketConfig: WsConfig) {}

  public async attach(): Promise<void> {
    if (!this.Server.instance) {
      return
    }

    this.io.attach(this.Server.instance, this.socketConfig)
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.io.close((err) => (err ? reject(err) : resolve()))
    })
  }
}

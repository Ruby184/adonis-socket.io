/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * The application provider that adds socket.io websocket server
 * and attaches it to adonis http server.
 */
export default class WsProvider {
  constructor(protected app: ApplicationContract) {}

  /**
   * Registering the health check provider
   */
  protected registerWs() {
    this.app.container.singleton('Ruby184/Socket.IO/Ws', (container) => {
      const { WsServer } = require('../src/Ws')
      const Server = container.use('Adonis/Core/Server')
      const Config = container.use('Adonis/Core/Config')

      return new WsServer(Server, Config.get('socket', {}))
    })
  }

  /**
   * Registering all required bindings to the container
   */
  public register() {
    this.registerWs()
  }

  /**
   * Register hooks and health checkers on boot
   */
  public boot() {
    //
  }

  /**
   * When application is ready attach socket.io to adonis http server
   */
  public async ready() {
    return this.app.container.resolveBinding('Ruby184/Socket.IO/Ws').attach()
  }

  /**
   * When application is shutting down close all active websocket conections
   */
  public async shutdown() {
    return this.app.container.resolveBinding('Ruby184/Socket.IO/Ws').close()
  }
}

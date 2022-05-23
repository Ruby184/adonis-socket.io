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
   * Registering the main ws server
   */
  protected registerWs() {
    this.app.container.singleton('Ruby184/Socket.IO/Ws', (container) => {
      const { WsServer } = require('../src/Ws')
      const Config = container.use('Adonis/Core/Config')

      return new WsServer(this.app, {
        // TODO: handle transformaton of adonis cors config as they are not 100% compatible
        cors: Config.get('cors', {}),
        ...Config.get('socket', {}),
      })
    })
  }

  /**
   * Registering ws context
   */
  protected registerWsContext() {
    this.app.container.singleton('Ruby184/Socket.IO/WsContext', (container) => {
      const { extendHttpContext } = require('../src/WsContext')
      return extendHttpContext(container.resolveBinding('Adonis/Core/HttpContext'))
    })
  }

  /**
   * Registering ws middleware store to the container
   */
  protected registerMiddlewareStore() {
    this.app.container.bind('Ruby184/Socket.IO/MiddlewareStore', () => {
      const { MiddlewareStore } = require('../src/MiddlewareStore')
      return MiddlewareStore
    })
  }

  /**
   * Registering `WsExceptionHandler` to the container.
   */
  protected registerWsExceptionHandler() {
    this.app.container.bind('Ruby184/Socket.IO/WsExceptionHandler', () => {
      const { WsExceptionHandler } = require('../src/WsExceptionHandler')
      return WsExceptionHandler
    })
  }

  /**
   * Registering all required bindings to the container
   */
  public register() {
    this.registerWs()
    this.registerWsContext()
    this.registerMiddlewareStore()
    this.registerWsExceptionHandler()
  }

  /**
   * Do some monkey patching so things like auth is working fine with sockets
   */
  public boot() {
    this.app.container.withBindings(
      ['Adonis/Addons/Auth', 'Ruby184/Socket.IO/WsContext'],
      (Auth, WsContext) => {
        const { patchAuthManager } = require('../src/Patch/Auth')
        patchAuthManager(Auth, WsContext)
      }
    )
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

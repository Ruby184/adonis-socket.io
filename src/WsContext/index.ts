/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { WsContextContract, WsSocket } from '@ioc:Ruby184/Socket.IO/WsContext'
import type { LoggerContract } from '@ioc:Adonis/Core/Logger'
import type { RequestContract } from '@ioc:Adonis/Core/Request'
import type { ResponseContract } from '@ioc:Adonis/Core/Response'
import type { ProfilerRowContract } from '@ioc:Adonis/Core/Profiler'
import type { NamespaceNode } from '@ioc:Ruby184/Socket.IO/Ws'
import type { HttpContextConstructorContract } from '@ioc:Adonis/Core/HttpContext'

export function extendHttpContext(HttpContext: HttpContextConstructorContract): any {
  return class WsContext extends HttpContext implements WsContextContract {
    protected static macros = {}
    protected static getters = {}

    public namespace: NamespaceNode

    // TODO: get rid of response and throw exception when trying to use it from socket context
    constructor(
      request: RequestContract,
      response: ResponseContract,
      logger: LoggerContract,
      profiler: ProfilerRowContract,
      public socket: WsSocket
    ) {
      super(request, response, logger, profiler)
      this.socket.ctx = this
    }
  }
}

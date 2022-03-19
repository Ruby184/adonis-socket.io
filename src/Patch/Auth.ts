/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type {
  AuthManagerContract,
  OATGuardConfig,
  UserProviderContract,
} from '@ioc:Adonis/Addons/Auth'
import type { WsContextConstructorContract } from '@ioc:Ruby184/Socket.IO/WsContext'

// here we will patch auth oat guard to take auth token from socket handshake
// not the best solution but it works for now
export function patchAuthManager(
  Auth: AuthManagerContract,
  WsContext: WsContextConstructorContract
): void {
  const { AuthenticationException } = require('@adonisjs/auth/build/standalone')
  const originalMakeOatGuard = Auth['makeOatGuard']

  Auth['makeOatGuard'] = function makeOatGuard(
    mapping: string,
    config: OATGuardConfig<never>,
    provider: UserProviderContract<any>,
    ctx: HttpContextContract
  ) {
    const guard = originalMakeOatGuard.call(this, mapping, config, provider, ctx)

    if (ctx instanceof WsContext) {
      guard.getBearerToken = function getBearerToken(): string {
        const token = this.ctx.socket.handshake.auth.token

        if (!token) {
          throw AuthenticationException.invalidToken(this.name)
        }

        return token
      }
    }

    return guard
  }
}

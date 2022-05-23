/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import type { WsErrorResponse } from '@ioc:Ruby184/Socket.IO/WsExceptionHandler'

/**
 * Ws exception handler serves as the base exception handler
 * to handle all exceptions occured during the WS connection
 * lifecycle and makes appropriate response for them.
 */
export abstract class WsExceptionHandler {
  /**
   * An array of error codes that must not be reported
   */
  protected ignoreCodes: string[] = []

  /**
   * An array of http statuses that must not be reported. The first
   * level of filteration is on the basis of statuses and then
   * the error codes.
   */
  protected ignoreStatuses: number[] = [400, 422, 401]

  /**
   * An array of internal error codes to ignore
   * from the reporting list
   */
  protected internalIgnoreCodes: string[] = ['E_MISSING_EVENT_HANDLER']

  constructor(protected app: ApplicationContract) {}

  /**
   * A custom context to send to the logger when reporting
   * errors.
   */
  protected context(_: WsContextContract): any {
    return {}
  }

  /**
   * Returns a boolean telling if a given error is supposed
   * to be logged or not
   */
  protected shouldReport(error: any): boolean {
    /**
     * Do not report the error when it's status is mentioned inside
     * the `ignoreStatuses` array.
     */
    if (error.status && this.ignoreStatuses.includes(error.status)) {
      return false
    }

    /**
     * Don't report when error has a code and it's in the ignore list.
     */
    if (error.code && this.ignoreCodes.concat(this.internalIgnoreCodes).includes(error.code)) {
      return false
    }

    return true
  }

  /**
   * Makes the response, based upon the environment in which the app is runing
   */
  protected async makeResponse(error: any, _: WsContextContract): Promise<WsErrorResponse> {
    return {
      name: error.name || 'Error',
      message: error.message,
      data: {
        status: error.status || 500,
        code: error.code,
        ...(this.app.inDev ? { stack: error.stack } : {}),
      },
    }
  }

  /**
   * Report a given error
   */
  public report(error: any, ctx: WsContextContract): void {
    if (!this.shouldReport(error)) {
      return
    }

    if (typeof error.wsReport === 'function') {
      return error.wsReport(error, ctx)
    }

    const status = error.status || 500

    /**
     * - Using `error` for `500 and above`
     * - `warn` for `400 and above`
     * - `info` for rest. This should not happen, but technically it's possible for someone
     *    to raise with 200
     */
    if (status >= 500) {
      if (this.app.nodeEnvironment !== 'test') {
        ctx.logger.error({ err: error, ...this.context(ctx) }, error.message)
      }
    } else if (status >= 400) {
      ctx.logger.warn(this.context(ctx), error.message)
    } else {
      ctx.logger.info(this.context(ctx), error.message)
    }
  }

  /**
   * Handle exception and make response
   */
  public async handle(error: any, ctx: WsContextContract): Promise<WsErrorResponse> {
    if (typeof error.wsHandle === 'function') {
      return error.wsHandle(error, ctx)
    }

    return this.makeResponse(error, ctx)
  }
}

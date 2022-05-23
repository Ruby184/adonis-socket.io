/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type {
  IocContract,
  IocResolverContract,
  IocResolverLookupNode,
} from '@ioc:Adonis/Core/Application'
import type { ErrorHandler, ResolvedErrorHandler } from '@ioc:Ruby184/Socket.IO/Ws'
import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import type { WsErrorResponse } from '@ioc:Ruby184/Socket.IO/WsExceptionHandler'

/**
 * Exception manager exposes the API to register custom error handler
 * and invoke it when exceptions are raised during the WS lifecycle.
 */
export class ExceptionManager {
  /**
   * Resolved copy of error handler
   */
  private resolvedErrorHandler?: ResolvedErrorHandler

  /**
   * Resolved copy of error reporter
   */
  private resolvedErrorReporter?: IocResolverLookupNode<string>

  /**
   * A reference to ioc resolver to resolve the error handler from
   * the IoC container
   */
  private resolver: IocResolverContract<any>

  constructor(container: IocContract) {
    this.resolver = container.getResolver()
  }

  /**
   * Register a custom error handler
   */
  public registerHandler(handler: ErrorHandler) {
    if (typeof handler === 'string') {
      this.resolvedErrorHandler = this.resolver.resolve(`${handler}.handle`)
      this.resolvedErrorReporter = this.resolver.resolve(`${handler}.report`)
    } else {
      this.resolvedErrorHandler = { type: 'function', handler }
    }
  }

  /**
   * Serialize error to response object which is send to client
   */
  private serializeError(error: any): WsErrorResponse {
    return {
      name: error.name || 'Error',
      message: error.message,
      data: { status: error.status || 500 },
    }
  }

  /**
   * Handle error
   */
  private async handleError(error: any, ctx: WsContextContract): Promise<WsErrorResponse> {
    /*
     * Return error message only when no error handler has been registered
     */
    if (!this.resolvedErrorHandler) {
      return this.serializeError(error)
    }

    /*
     * Invoke the error handler and catch any errors raised by the error
     * handler itself. We don't expect error handlers to raise exceptions.
     * However, during development a broken error handler may raise
     * exceptions.
     */
    try {
      let response: any = null

      if (this.resolvedErrorHandler.type === 'function') {
        response = await this.resolvedErrorHandler.handler(error, ctx)
      } else {
        response = await this.resolver.call(this.resolvedErrorHandler, undefined, [error, ctx])
      }

      return response || this.serializeError(error)
    } catch (finalError) {
      /*
       * Unexpected block
       */
      ctx.logger.fatal(
        finalError,
        'Unexpected exception raised from WS ExceptionHandler "handle" method'
      )

      return this.serializeError(error)
    }
  }

  /**
   * Report error when report method exists
   */
  private async reportError(error: any, ctx: WsContextContract) {
    if (!this.resolvedErrorReporter) {
      return
    }

    try {
      await this.resolver.call(this.resolvedErrorReporter, undefined, [error, ctx])
    } catch (finalError) {
      ctx.logger.fatal(
        finalError,
        'Unexpected exception raised from WS ExceptionHandler "report" method'
      )
    }
  }

  /**
   * Handle the error
   */
  public async handle(error: any, ctx: WsContextContract) {
    const response = await this.handleError(error, ctx)
    this.reportError(error, ctx)
    return response
  }
}

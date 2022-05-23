/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Ruby184/Socket.IO/WsExceptionHandler' {
  import { ApplicationContract } from '@ioc:Adonis/Core/Application'
  import { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'

  export interface WsErrorResponse extends Error {
    data?: Partial<{
      status: number
      code: string
      stack: string
      [prop: string]: any
    }>
  }

  export interface WsExceptionHandlerContract {
    report(error: any, ctx: WsContextContract): void
    handle(error: any, ctx: WsContextContract): Promise<WsErrorResponse>
  }

  export default abstract class WsExceptionHandler implements WsExceptionHandlerContract {
    constructor(app: ApplicationContract)
    protected app: ApplicationContract
    protected ignoreCodes: string[]
    protected ignoreStatuses: number[]
    protected internalIgnoreCodes: string[]
    protected context(ctx: WsContextContract): any
    protected shouldReport(error: any): boolean
    protected makeResponse(error: any, ctx: WsContextContract): Promise<WsErrorResponse>
    public report(error: any, ctx: WsContextContract): void
    public handle(error: any, ctx: WsContextContract): Promise<WsErrorResponse>
  }
}

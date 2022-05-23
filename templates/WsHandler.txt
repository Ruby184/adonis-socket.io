/*
|--------------------------------------------------------------------------
| Ws Exception Handler
|--------------------------------------------------------------------------
|
| @ruby184/adonis-socket.io package will forward all exceptions occurred
| during a websocket connection to the following class.
|
| The exception handler extends a base `WsExceptionHandler` which is not
| mandatory, however it can do lot of heavy lifting to handle the errors
| properly.
|
*/

import Application from '@ioc:Adonis/Core/Application'
import WsExceptionHandler from '@ioc:Ruby184/Socket.IO/WsExceptionHandler'

export default class ExceptionHandler extends WsExceptionHandler {
  constructor() {
    super(Application)
  }
}

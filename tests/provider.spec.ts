import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { test } from '@japa/runner'
import { MiddlewareStore } from '../src/MiddlewareStore'
import { WsServer } from '../src/Ws'
import { WsExceptionHandler } from '../src/WsExceptionHandler'
import { setupApp, fs } from '../test-helpers'

test.group('Socket.io Provider', (group) => {
  let app: ApplicationContract

  group.each.setup(async () => {
    app = await setupApp()
    return () => fs.cleanup()
  })

  test('register socket.io provider', async ({ assert }) => {
    assert.instanceOf(app.container.use('Ruby184/Socket.IO/Ws'), WsServer)
    assert.deepEqual(app.container.use('Ruby184/Socket.IO/MiddlewareStore'), MiddlewareStore)
    assert.deepEqual(app.container.use('Ruby184/Socket.IO/WsExceptionHandler'), WsExceptionHandler)
    // check if ws context extends http context
    assert.instanceOf(
      app.container.use('Ruby184/Socket.IO/WsContext').prototype,
      app.container.use('Adonis/Core/HttpContext')
    )
  })
})

# @ruby184/adonis-socket.io
> AdonisJs 5 websocket provider using socket.io under the hood

[![github-actions-image]][github-actions-url] [![npm-image]][npm-url] [![license-image]][license-url] [![typescript-image]][typescript-url]

This package is trying to implement main ideas from [this Adonis RFC](https://github.com/thetutlage/rfcs/blob/develop/active-rfcs/0000-websockets.md). Package is not production ready until v1.0. Use it at your own risk.

## Installation

Install it from npm
```
npm i @ruby184/adonis-socket.io
```
and then configure it using adonis

```
node ace configure @ruby184/adonis-socket.io
```
## TODO
- [x] allow `.where` regex definition for namespace dynamic parameters
- [x] allow to define controller namespace for socket.io namespace
- [x] define static namespaces directly as socket.io namespaces and use matching only for dynamic ones (perf)
- [ ] test everything
- [ ] we should not create and use response, but return Proxy to intercept and throw error when user tries to use response in websocket context
- [ ] extract errors handling to dedicated exception handler to report and handle
- [ ] look at how to make easy integration of socket.io multi server support with adonis
- [ ] look how we can make use of socket middleware which is a function that gets executed for every incoming Packet
- [ ] handle transformaton of adonis cors config to socket.io as they are not 100% compatible

## Usage

## Examples
Here is an example of tracking users online status using this package inspired by default examples from socket.io

1. Currently package supports authentication by api tokens.
Update middleware created by `@adonisjs/auth` in `app/Middleware/Auth.ts` and add `wsHandle` method to support websockets

```typescript
import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
```

```typescript
  /**
   * Handle ws namespace connection
   */
  public async wsHandle(
    { auth }: WsContextContract,
    next: () => Promise<void>,
    customGuards: (keyof GuardsList)[]
  ) {
    /**
     * Uses the user defined guards or the default guard mentioned in
     * the config file
     */
    const guards = customGuards.length ? customGuards : [auth.name]
    await this.authenticate(auth, guards)
    await next()
  }
```

2. Update `start/wsKernel.ts` to add authentication middleware updated in previous step.
We will add global middleware but you can also use named one and just add it to required nameespace in next step.

```typescript
Ws.middleware.register([() => import('App/Middleware/Auth')])
```

3. Add events listeners in `start/socket.ts`

```typescript
Ws.namespace('/')
  .connected('ActivityController.onConnected')
  .disconnected('ActivityController.onDisconnected')
```

4. Create a websocket controller in `app/Controllers/Ws/ActivityController.ts` 

```typescript
import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import User from 'App/Models/User'

export default class ActivityController {
  private getUserRoom(user: User): string {
    return `user:${user.id}`
  }

  public async onConnected({ socket, auth, logger }: WsContextContract) {
    // all connections for the same authenticated user will be in the room
    const room = this.getUserRoom(auth.user!)
    const userSockets = await socket.in(room).allSockets()

    // this is first connection for given user
    if (userSockets.size === 0) {
      socket.broadcast.emit('user:online', auth.user)
    }

    // add this socket to user room
    socket.join(room)
    // add userId to data shared between Socket.IO servers
    // https://socket.io/docs/v4/server-api/#namespacefetchsockets
    socket.data.userId = auth.user!.id

    const allSockets = await socket.nsp.except(room).fetchSockets()
    const onlineIds = new Set<number>()

    for (const remoteSocket of allSockets) {
      onlineIds.add(remoteSocket.data.userId)
    }

    const onlineUsers = await User.findMany([...onlineIds])

    socket.emit('user:list', onlineUsers)

    logger.info('user connected: %d', auth.user!.id)
  }

  // see https://socket.io/get-started/private-messaging-part-2/#disconnection-handler
  public async onDisconnected({ socket, auth, logger }: WsContextContract, reason: string) {
    const room = this.getUserRoom(auth.user!)
    const userSockets = await socket.in(room).allSockets()

    // user is disconnected
    if (userSockets.size === 0) {
      // notify other users
      socket.broadcast.emit('user:offline', auth.user)
    }

    logger.info('user disconnected (%s): %d', reason, auth.user!.id)
  }
}
```

[github-actions-image]: https://img.shields.io/github/workflow/status/ruby184/adonis-socket.io/test?style=for-the-badge
[github-actions-url]: https://github.com/Ruby184/adonis-socket.io/actions/workflows/test.yml "github-actions"

[npm-image]: https://img.shields.io/npm/v/@ruby184/adonis-socket.io.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@ruby184/adonis-socket.io "npm"

[license-image]: https://img.shields.io/npm/l/@ruby184/adonis-socket.io?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"

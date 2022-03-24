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
- [ ] allow `.where` regex definition for namespace dynamic parameters
- [ ] allow to define controller namespace for socket.io namespace
- [ ] define static namespaces directly as socket.io namespaces and use matching only for dynamic ones (perf)
- [ ] test everything
- [ ] look how we can make use of socket middleware which is a function that gets executed for every incoming Packet
- [ ] handle transformaton of adonis cors config to socket.io as they are not 100% compatible
- [ ] we should not create and use response, but return Proxy to intercept and throw error when user tries to use response in websocket context
- [ ] extract errors handling to dedicated exception handler to report and handle

## Usage

[github-actions-image]: https://img.shields.io/github/workflow/status/ruby184/adonis-socket.io/test?style=for-the-badge
[github-actions-url]: https://github.com/Ruby184/adonis-socket.io/actions/workflows/test.yml "github-actions"

[npm-image]: https://img.shields.io/npm/v/@ruby184/adonis-socket.io.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@ruby184/adonis-socket.io "npm"

[license-image]: https://img.shields.io/npm/l/@ruby184/adonis-socket.io?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"

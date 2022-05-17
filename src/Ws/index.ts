/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type {
  WsContract,
  WsConfig,
  NamespaceMatchersNode,
  NamespaceParamMatcher,
  NamespaceMatchersConstructorContract,
  NamespaceMatchersContract,
} from '@ioc:Ruby184/Socket.IO/Ws'
import { Server as IoServer } from 'socket.io'
import { WsNamespace } from './WsNamespace'
import { Store } from './Store'
import { MiddlewareStore } from '../MiddlewareStore'
import { PreCompiler } from './PreCompiler'
import { HandlerExecutor } from './HandlerExecutor'
import { types } from '@poppinss/utils/build/helpers'

/**
 * WsServer class handles the wiring of socket.io Server with adonis core
 * to allow definition of namespaces in adonis-like style.
 */
export class WsServer implements WsContract {
  /**
   * Global matchers to test namespace params against regular expressions.
   */
  private paramMatchers: NamespaceMatchersNode = {}

  /**
   * Flag to know if instance is attached to http server.
   */
  private attached: boolean = false

  /**
   * Reference to the original socket.io server
   */
  public io = new IoServer()

  /**
   * The middleware store to register global and named middleware
   */
  public middleware = new MiddlewareStore(this.application.container)

  /**
   * Currently defined namespaces keyed by pattern
   */
  public namespaces: { [pattern: string]: WsNamespace } = {}

  /**
   * Store to register tokenized namespaces
   */
  private store = new Store()

  /**
   * Precompiler to set compiled handlers and middlewares to namespaces
   */
  private precompiler = new PreCompiler(this.application.container, this.middleware)

  /**
   * Executor wires together all the pieces to attach the namespaces to socket.io
   * and execute handlers defined for namespaces with created instance of WsContext.
   */
  private executor = new HandlerExecutor(this.application, this.precompiler, this.store, this.io)

  /**
   * Exposing WsNamespace and NamespaceMatchers constructors to be extended from outside
   */
  public WsNamespace = WsNamespace
  public NamespaceMatchers = this.getNamespaceMatchersClass()

  /**
   * Shortcut methods for commonly used matchers (extending the route matchers from adonis router)
   */
  public matchers = new this.NamespaceMatchers()

  constructor(private application: ApplicationContract, private socketConfig: WsConfig) {}

  /**
   * Get class for matchers by extending the RouteMatchers class from adonis http-server package
   * so the extended matchers are also reflected to our class but can also be extended separately.
   */
  private getNamespaceMatchersClass(): NamespaceMatchersConstructorContract {
    const Route = this.application.container.resolveBinding('Adonis/Core/Route')
    const RouteMatchers = Route.RouteMatchers as typeof Route['RouteMatchers'] & {
      new (): NamespaceMatchersContract
    }

    return class NamespaceMatchers extends RouteMatchers {
      protected static macros = {}
      protected static getters = {}
    }
  }

  /**
   * Define global route matcher
   */
  public where(param: string, matcher: NamespaceParamMatcher): this {
    if (typeof matcher === 'string') {
      this.paramMatchers[param] = { match: new RegExp(matcher) }
    } else if (types.isRegexp(matcher)) {
      this.paramMatchers[param] = { match: matcher }
    } else {
      this.paramMatchers[param] = matcher
    }

    return this
  }

  /**
   * Define a namespace with given name or pattern
   */
  public namespace(pattern: string): WsNamespace {
    const nsp = WsNamespace.normalize(pattern)

    if (!this.namespaces[nsp]) {
      this.namespaces[nsp] = new WsNamespace(nsp, this.paramMatchers)
    }

    return this.namespaces[nsp]
  }

  /**
   * Commit namespaces to the store. After this, no more namespaces can be registered.
   */
  public commit() {
    Object.values(this.namespaces).forEach((namespace) => {
      const nsp = namespace.toJSON()
      this.precompiler.compileNamespace(nsp)
      this.store.add(nsp)
    })

    this.namespaces = {}
  }

  public async attach(): Promise<void> {
    this.commit()
    this.attached = this.executor.attach(this.socketConfig)
  }

  public async close(): Promise<void> {
    if (!this.attached) {
      return
    }

    return new Promise((resolve, reject) => {
      this.io.close((err) => (err ? reject(err) : resolve()))
    })
  }
}

/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { MatchedNamespace, NamespaceNode, NamespacesTree } from '@ioc:Ruby184/Socket.IO/Ws'
import matchit from '@poppinss/matchit'
import { Exception } from '@poppinss/utils'

export class Store {
  public tree: NamespacesTree = { tokens: [], namespaces: {} }

  public add(nsp: NamespaceNode): this {
    const tokens = matchit.parse(nsp.pattern, {})
    const collectedParams: Set<string> = new Set()

    /**
     * Avoiding duplicate route params
     */
    for (const token of tokens) {
      if ([1, 3].includes(token.type)) {
        if (collectedParams.has(token.val)) {
          throw new Exception(
            `The "${token.val}" param is mentioned twice in the namespace pattern "${nsp.pattern}"`,
            500,
            'E_DUPLICATE_NAMESPACE_PARAM'
          )
        } else {
          collectedParams.add(token.val)
        }
      }
    }

    collectedParams.clear()

    this.tree.tokens.push(tokens)
    this.tree.namespaces[nsp.pattern] = nsp

    return this
  }

  public check(name: string): boolean {
    return matchit.match(name, this.tree.tokens).length > 0
  }

  public match(name: string): null | MatchedNamespace {
    const matched = matchit.match(name, this.tree.tokens)

    if (!matched.length) {
      return null
    }

    return {
      namespace: this.tree.namespaces[matched[0].old],
      params: matchit.exec(name, matched),
    }
  }
}

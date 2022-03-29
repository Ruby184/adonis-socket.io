import { test } from '@japa/runner'
import { Store } from '../src/Ws/Store'

test.group('Namespace Store | add', () => {
  test('add static namespace: {pattern}')
    .with([{ pattern: '/' }, { pattern: '/admin' }])
    .run(async ({ assert }, { pattern }) => {
      const namespace = {
        pattern,
        handlers: {},
        meta: {},
        middleware: [],
      }

      const store = new Store()

      store.add(namespace)

      assert.deepEqual(store.tree, {
        tokens: [],
        static: {
          [pattern]: namespace,
        },
        dynamic: {},
      })
    })

  test('add dynamic namespace: {pattern}')
    .with([
      {
        pattern: '/channels/:name',
        tokens: [
          {
            old: '/channels/:name',
            type: 0,
            val: 'channels',
            end: '',
          },
          {
            old: '/channels/:name',
            type: 1,
            val: 'name',
            end: '',
            cast: undefined,
            matcher: undefined,
          },
        ],
      },
      {
        pattern: '/users/:id?',
        tokens: [
          {
            old: '/users/:id?',
            type: 0,
            val: 'users',
            end: '',
          },
          {
            old: '/users/:id?',
            type: 3,
            val: 'id',
            end: '',
            cast: undefined,
            matcher: undefined,
          },
        ],
      },
      {
        pattern: '/chat/*',
        tokens: [
          {
            old: '/chat/*',
            type: 0,
            val: 'chat',
            end: '',
          },
          {
            old: '/chat/*',
            type: 2,
            val: '*',
            end: '',
          },
        ],
      },
    ])
    .run(async ({ assert }, { pattern, tokens }) => {
      const namespace = {
        pattern,
        handlers: {},
        meta: {},
        middleware: [],
      }

      const store = new Store()

      store.add(namespace)

      assert.deepEqual(store.tree, {
        tokens: [tokens],
        static: {},
        dynamic: {
          [pattern]: namespace,
        },
      })
    })

  test('raise error when two params in pattern have the same name: {pattern}')
    .with([
      {
        pattern: '/:name/:id/:name',
        duplicate: 'name',
      },
      {
        pattern: '/:name/:id/:id?',
        duplicate: 'id',
      },
    ])
    .run(({ assert }, { pattern, duplicate }) => {
      const namespace = { pattern, handlers: {}, meta: {}, middleware: [] }
      const store = new Store()
      const fn = () => store.add(namespace)

      assert.throws(
        fn,
        `E_DUPLICATE_NAMESPACE_PARAM: The "${duplicate}" param is mentioned twice in the namespace pattern "${pattern}"`
      )
    })
})

test.group('Namespace Store | statics and isDynamic', (group) => {
  let store: Store

  group.each.setup(() => {
    store = new Store()

    for (const pattern of [
      '/',
      '/admin',
      '/channels/@me',
      '/channels/:name',
      '/users/:username?',
      '/chat/*',
    ]) {
      store.add({
        pattern,
        handlers: {},
        meta: {},
        middleware: [],
      })
    }
  })

  test('statics returns all defined static namespaces', ({ assert }) => {
    assert.sameMembers(store.statics(), ['/', '/admin', '/channels/@me'])
  })

  test('determine if namespace is dynamic: {name}')
    .with([
      { name: '/', outcome: false },
      { name: '/admin', outcome: false },
      { name: '/admin/child', outcome: false },
      { name: '/nonexistent', outcome: false },
      { name: '/doesnot/exist', outcome: false },
      // { name: '/channels/@me', outcome: false },
      { name: '/channels/general', outcome: true },
      { name: '/channels/general/ruby184', outcome: false },
      { name: '/users', outcome: true },
      { name: '/users/ruby184', outcome: true },
      { name: '/chat', outcome: false },
      { name: '/chat/@me/ruby184', outcome: true },
    ])
    .run(async ({ assert }, { name, outcome }) => {
      if (outcome) {
        assert.isTrue(store.isDynamic(name))
      } else {
        assert.isFalse(store.isDynamic(name))
      }
    })
})

test.group('Namespace Store | match', (group) => {
  let store: Store

  group.each.setup(() => {
    store = new Store()

    for (const pattern of [
      '/',
      '/admin',
      '/channels/@me',
      '/channels/:name',
      '/users/:id?',
      '/chat/*',
    ]) {
      store.add({
        pattern,
        handlers: {},
        meta: {},
        middleware: [],
      })
    }
  })

  test('match static namespace: {name}')
    .with([
      {
        name: '/',
      },
      {
        name: '/admin',
      },
    ])
    .run(async ({ assert }, { name }) => {
      const namespace = {
        pattern: name,
        handlers: {},
        meta: {},
        middleware: [],
      }

      assert.deepEqual(store.match(name), { namespace, params: {} })
    })

  test('match dynamic namespace: {name}')
    .with([
      {
        name: '/channels/general',
        pattern: '/channels/:name',
        params: { name: 'general' },
      },
      {
        name: '/users',
        pattern: '/users/:id?',
        params: {},
      },
      {
        name: '/users/184',
        pattern: '/users/:id?',
        params: { id: '184' },
      },
      {
        name: '/chat/@me/ruby184/859523799083122768',
        pattern: '/chat/*',
        params: { '*': ['@me', 'ruby184', '859523799083122768'] },
      },
    ])
    .run(async ({ assert }, { name, pattern, params }) => {
      const namespace = {
        pattern,
        handlers: {},
        meta: {},
        middleware: [],
      }

      assert.deepEqual(store.match(name), { namespace, params })
    })

  test('static namespace has priority over dynamic if defined', async ({ assert }) => {
    assert.deepEqual(store.match('/channels/@me'), {
      namespace: {
        pattern: '/channels/@me',
        handlers: {},
        meta: {},
        middleware: [],
      },
      params: {},
    })

    assert.deepEqual(store.match('/channels/me'), {
      namespace: {
        pattern: '/channels/:name',
        handlers: {},
        meta: {},
        middleware: [],
      },
      params: { name: 'me' },
    })
  })

  test('return null when unable to match namespace', ({ assert }) => {
    assert.isNull(store.match('/hello'))
  })
})

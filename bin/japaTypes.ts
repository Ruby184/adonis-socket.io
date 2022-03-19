import { Assert } from '@japa/assert'

declare module '@japa/runner' {
  interface TestContext {
    // notify TypeScript about custom context properties
    assert: Assert
  }

  interface Test {
    // notify TypeScript about custom test properties
  }
}

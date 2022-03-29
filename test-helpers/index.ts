import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/application'

export const fs = new Filesystem(join(__dirname, 'app'))

/**
 * Setup application
 */
export async function setupApp(providers?: string[]) {
  const app = new Application(fs.basePath, 'web', {
    providers: ['@adonisjs/core', '../../providers/WsProvider'].concat(providers || []),
  })

  await fs.add('.env', '')
  await fs.add(
    'config/app.ts',
    `
    export const appKey = 'verylongandrandom32charsecretkey'
    export const http = {
      trustProxy: () => true,
      cookie: {},
    }
    `
  )

  await app.setup()
  await app.registerProviders()
  await app.bootProviders()

  return app
}

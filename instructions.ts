/*
 * @ruby184/adonis-socket.io
 *
 * (c) Ľubomír "Ruby" Jesze <lubomir.j184@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import * as sinkStatic from '@adonisjs/sink'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

const EXCEPTION_HANDLER_TEMPLATE_STUB = join(__dirname, 'templates', 'WsHandler.txt')
const EXCEPTION_HANDLER_NAME = 'WsHandler'

/**
 * Configure package
 */
export default async function instructions(
  projectRoot: string,
  app: ApplicationContract,
  { logger, files }: typeof sinkStatic
) {
  const exceptionsNamespace = app.namespacesMap.get('exceptions') || 'App/Exceptions'
  const exceptionsDirectory = app.resolveNamespaceDirectory('exceptions') || 'app/Exceptions'
  const wsHandlerPath = `${exceptionsDirectory}/${EXCEPTION_HANDLER_NAME}.ts`

  /**
   * Create ws exception handler
   */
  const wsHandler = new files.MustacheFile(
    projectRoot,
    wsHandlerPath,
    EXCEPTION_HANDLER_TEMPLATE_STUB
  )

  if (wsHandler.exists()) {
    logger.action('create').skipped(wsHandlerPath, 'File already exists')
  } else {
    wsHandler.apply({}).commit()
    logger.action('create').succeeded(wsHandlerPath)

    /**
     * Add `wsExceptionHandlerNamespace` to .adonisrc file
     */
    const rcFile = new files.AdonisRcFile(projectRoot)
    rcFile.set('wsExceptionHandlerNamespace', `${exceptionsNamespace}/${EXCEPTION_HANDLER_NAME}`)
    rcFile.commit()
    logger.action('update').succeeded('.adonisrc.json')
  }
}

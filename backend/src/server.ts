import { app } from './app.js'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'
import { redis, pubClient, subClient } from './lib/redis.js'
import { initializeSocket, io } from './sockets/index.js'
import { logger } from './utils/logger.js'

const server = app.listen(env.port, () => {
  logger.info(`API server running in ${env.nodeEnv} mode on http://localhost:${env.port}`)
})

initializeSocket(server)

let isShuttingDown = false

const shutdown = (signal: string): void => {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`${signal} signal received. Initiating graceful shutdown...`)

  // 1. Stop accepting new HTTP connections
  server.close(async () => {
    logger.info('HTTP server closed.')

    try {
      // 2. Close Socket.IO connections
      if (io) {
        logger.info('Closing Socket.IO server...')
        await io.close()
      }

      // 3. Disconnect Redis clients
      logger.info('Disconnecting Redis...')
      await Promise.allSettled([
        redis.quit().catch(() => {}),
        pubClient.quit().catch(() => {}),
        subClient.quit().catch(() => {}),
      ])

      // 4. Disconnect Prisma
      logger.info('Disconnecting Prisma Client...')
      await prisma.$disconnect()

      logger.info('Graceful shutdown completed. Exiting process.')
      process.exit(0)
    } catch (error) {
      logger.error('Error during graceful shutdown', error)
      process.exit(1)
    }
  })

  // Force exit if shutdown hangs longer than 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout')
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

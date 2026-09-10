import type { RequestHandler } from 'express'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)),
  ])
}

export const getHealth: RequestHandler = (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  })
}

export const getReady: RequestHandler = async (_request, response) => {
  let dbOk = false
  let redisOk = false

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 1500)
    dbOk = true
  } catch (err) {
    dbOk = false
  }

  try {
    const pingRes = await withTimeout(redis.ping(), 1500)
    redisOk = pingRes === 'PONG'
  } catch (err) {
    redisOk = false
  }

  const isReady = dbOk

  response.status(isReady ? 200 : 503).json({
    success: isReady,
    status: isReady ? 'UP' : 'DOWN',
    checks: {
      database: dbOk ? 'UP' : 'DOWN',
      redis: redisOk ? 'UP' : 'DEGRADED',
    },
    timestamp: new Date().toISOString(),
  })
}

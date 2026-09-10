import { Redis } from 'ioredis'
import { env } from '../config/env.js'

const isTls = env.redisUrl.startsWith('rediss://')

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null,
  tls: isTls ? { rejectUnauthorized: false } : undefined,
  retryStrategy(times: number) {
    // Retry connection gracefully
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

export const pubClient = redis
export const subClient = redis.duplicate()

let hasLoggedError = false

const handleError = (_err: Error) => {
  if (!hasLoggedError) {
    console.warn('⚠️ Redis is not running or unreachable. Falling back to in-memory mode for real-time features.')
    hasLoggedError = true
  }
}

pubClient.on('error', handleError)
subClient.on('error', handleError)

redis.on('connect', () => {
  console.info('Connected to Redis')
})

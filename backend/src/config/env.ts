import dotenv from 'dotenv'

dotenv.config()

const required = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const portValue = process.env.PORT ?? '5000'
const port = Number(portValue)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: required('DATABASE_URL'),
  frontendUrl: required('FRONTEND_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  accessTokenExpiresIn: required('ACCESS_TOKEN_EXPIRES_IN'),
  refreshTokenExpiresIn: required('REFRESH_TOKEN_EXPIRES_IN'),
  resetPasswordTokenExpiresIn: required('RESET_PASSWORD_TOKEN_EXPIRES_IN'),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  stunServers: process.env.STUN_SERVERS ?? 'stun:stun.l.google.com:19302',
  turnServerUrl: process.env.TURN_SERVER_URL,
  turnUsername: process.env.TURN_USERNAME,
  turnCredential: process.env.TURN_CREDENTIAL,
  cookieDomain: process.env.COOKIE_DOMAIN,
  r2AccountId: process.env.R2_ACCOUNT_ID,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2BucketName: process.env.R2_BUCKET_NAME,
  r2PublicUrl: process.env.R2_PUBLIC_URL,
} as const

export const isProduction = env.nodeEnv === 'production'

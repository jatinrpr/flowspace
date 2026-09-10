import type { Response } from 'express'
import { env, isProduction } from '../config/env.js'
import { durationToMilliseconds } from './duration.js'

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  path: '/',
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
}

export const setAuthCookies = (
  response: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  response.cookie('access_token', accessToken, {
    ...baseCookieOptions,
    maxAge: durationToMilliseconds(env.accessTokenExpiresIn),
  })
  response.cookie('refresh_token', refreshToken, {
    ...baseCookieOptions,
    maxAge: durationToMilliseconds(env.refreshTokenExpiresIn),
  })
}

export const clearAuthCookies = (response: Response): void => {
  response.clearCookie('access_token', baseCookieOptions)
  response.clearCookie('refresh_token', baseCookieOptions)
}

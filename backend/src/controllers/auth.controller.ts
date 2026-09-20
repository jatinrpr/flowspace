import type { RequestHandler } from 'express'
import { clearAuthCookies, setAuthCookies } from '../utils/cookies.js'
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from '../validators/auth.validator.js'
import * as authService from '../services/auth.service.js'

export const signup: RequestHandler = async (request, response) => {
  const input = signupSchema.parse(request.body)
  const result = await authService.signup(input, request)

  setAuthCookies(response, result.accessToken, result.refreshToken)
  response.status(201).json({
    success: true,
    message: 'Account created successfully',
    accessToken: result.accessToken,
    user: result.user,
  })
}

export const login: RequestHandler = async (request, response) => {
  const input = loginSchema.parse(request.body)
  const result = await authService.login(input, request)

  setAuthCookies(response, result.accessToken, result.refreshToken)
  response.status(200).json({
    success: true,
    message: 'Logged in successfully',
    accessToken: result.accessToken,
    user: result.user,
  })
}

export const me: RequestHandler = async (request, response) => {
  const user = await authService.getCurrentUser(request.auth!.userId)
  response.status(200).json({ success: true, user })
}

export const refresh: RequestHandler = async (request, response) => {
  const refreshToken = request.cookies.refresh_token as string | undefined

  if (!refreshToken) {
    clearAuthCookies(response)
    response
      .status(401)
      .json({ success: false, message: 'Invalid or expired refresh token' })
    return
  }

  const tokens = await authService.refresh(refreshToken, request)
  setAuthCookies(response, tokens.accessToken, tokens.refreshToken)
  response.status(200).json({ success: true, message: 'Session refreshed', accessToken: tokens.accessToken })
}

export const logout: RequestHandler = async (request, response) => {
  await authService.logout(request.cookies.refresh_token as string | undefined)
  clearAuthCookies(response)
  response
    .status(200)
    .json({ success: true, message: 'Logged out successfully' })
}

export const forgotPassword: RequestHandler = async (request, response) => {
  const input = forgotPasswordSchema.parse(request.body)
  const message = await authService.forgotPassword(input.email)
  response.status(200).json({ success: true, message })
}

export const resetPassword: RequestHandler = async (request, response) => {
  const input = resetPasswordSchema.parse(request.body)
  await authService.resetPassword(input)
  clearAuthCookies(response)
  response.status(200).json({
    success: true,
    message: 'Password reset successfully. Please sign in again.',
  })
}

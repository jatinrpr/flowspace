import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { authRateLimit } from '../middleware/auth-rate-limit.js'
import { requireAuth } from '../middleware/require-auth.js'

export const authRouter = Router()

authRouter.post('/signup', authRateLimit, authController.signup)
authRouter.post('/login', authRateLimit, authController.login)
authRouter.post('/logout', authController.logout)
authRouter.post('/refresh', authController.refresh)
authRouter.get('/me', requireAuth, authController.me)
authRouter.post(
  '/forgot-password',
  authRateLimit,
  authController.forgotPassword,
)
authRouter.post('/reset-password', authRateLimit, authController.resetPassword)

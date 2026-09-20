import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Security headers with Helmet configured for cross-origin assets, WebRTC & WebSockets
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})

// Authentication Rate Limiter (login, signup, password reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 requests per window
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
})

// General API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // 500 requests per 15 mins
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many API requests. Please slow down.' },
})

// Sensitive Action Rate Limiter (invitations, role changes, uploads)
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests for this action. Please try again later.' },
})

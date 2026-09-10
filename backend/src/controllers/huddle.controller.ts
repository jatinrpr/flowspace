import type { RequestHandler } from 'express'
import * as huddleService from '../services/huddle.service.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'
import { env } from '../config/env.js'

export const getChannelHuddle: RequestHandler<{ channelId: string }> = async (req, res, next) => {
  try {
    const { channelId } = req.params
    const userId = req.auth!.userId
    const m = await prisma.channelMember.findUnique({ where: { userId_channelId: { userId, channelId } } })
    if (!m) throw new AppError('Forbidden', 403)
    const huddle = await huddleService.getHuddleByTarget('channel', channelId)
    res.json({ success: true, huddle })
  } catch (err) { next(err) }
}

export const getConversationHuddle: RequestHandler<{ conversationId: string }> = async (req, res, next) => {
  try {
    const { conversationId } = req.params
    const userId = req.auth!.userId
    const m = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { userId, conversationId } } })
    if (!m) throw new AppError('Forbidden', 403)
    const huddle = await huddleService.getHuddleByTarget('conversation', conversationId)
    res.json({ success: true, huddle })
  } catch (err) { next(err) }
}

export const getIceServers: RequestHandler = (_req, res) => {
  const stunUrls = env.stunServers.split(',').map((s: string) => s.trim())
  const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
    { urls: stunUrls }
  ]

  if (env.turnServerUrl) {
    iceServers.push({
      urls: env.turnServerUrl,
      username: env.turnUsername || undefined,
      credential: env.turnCredential || undefined,
    })
  }

  res.json({ success: true, iceServers })
}

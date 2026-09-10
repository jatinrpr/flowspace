import { pubClient } from '../lib/redis.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/app-error.js'
import { v4 as uuidv4 } from 'uuid'

const HUDDLE_TTL = 60 * 60 * 3

const inMemoryHuddles = new Map<string, HuddleState>()

export interface HuddleParticipant {
  userId: string
  name: string
  avatarUrl: string | null
  joinedAt: string
  muted: boolean
  speaking: boolean
  cameraEnabled?: boolean
  screenSharing?: boolean
  socketId: string
}

export interface HuddleState {
  id: string
  targetType: 'channel' | 'conversation'
  channelId?: string
  conversationId?: string
  createdAt: string
  participants: Record<string, HuddleParticipant>
}

const isRedisReady = () => pubClient.status === 'ready'
const huddleKey = (id: string) => `huddle:${id}`
const indexKey = (type: string, targetId: string) => `huddle:idx:${type}:${targetId}`

export const getHuddleById = async (huddleId: string): Promise<HuddleState | null> => {
  if (isRedisReady()) {
    const raw = await pubClient.get(huddleKey(huddleId))
    return raw ? (JSON.parse(raw) as HuddleState) : null
  }
  return inMemoryHuddles.get(huddleId) ?? null
}

export const getHuddleByTarget = async (
  targetType: 'channel' | 'conversation',
  targetId: string
): Promise<HuddleState | null> => {
  if (isRedisReady()) {
    const id = await pubClient.get(indexKey(targetType, targetId))
    if (!id) return null
    return getHuddleById(id)
  }
  for (const h of inMemoryHuddles.values()) {
    if (targetType === 'channel' && h.channelId === targetId) return h
    if (targetType === 'conversation' && h.conversationId === targetId) return h
  }
  return null
}

export const saveHuddle = async (huddle: HuddleState): Promise<void> => {
  const tid = huddle.channelId ?? huddle.conversationId!
  if (isRedisReady()) {
    await pubClient.set(huddleKey(huddle.id), JSON.stringify(huddle), 'EX', HUDDLE_TTL)
    await pubClient.set(indexKey(huddle.targetType, tid), huddle.id, 'EX', HUDDLE_TTL)
  } else {
    inMemoryHuddles.set(huddle.id, huddle)
  }
}

export const deleteHuddle = async (huddle: HuddleState): Promise<void> => {
  const tid = huddle.channelId ?? huddle.conversationId!
  if (isRedisReady()) {
    await pubClient.del(huddleKey(huddle.id))
    await pubClient.del(indexKey(huddle.targetType, tid))
  } else {
    inMemoryHuddles.delete(huddle.id)
  }
}

export const createOrJoinHuddle = async (
  userId: string,
  userName: string,
  avatarUrl: string | null,
  socketId: string,
  targetType: 'channel' | 'conversation',
  targetId: string
): Promise<{ huddle: HuddleState; isNew: boolean }> => {
  if (targetType === 'channel') {
    const m = await prisma.channelMember.findUnique({
      where: { userId_channelId: { userId, channelId: targetId } }
    })
    if (!m) throw new AppError('Not a channel member', 403)
  } else {
    const m = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { userId, conversationId: targetId } }
    })
    if (!m) throw new AppError('Not a conversation member', 403)
  }

  let huddle = await getHuddleByTarget(targetType, targetId)
  const isNew = !huddle

  if (!huddle) {
    huddle = {
      id: uuidv4(),
      targetType,
      channelId: targetType === 'channel' ? targetId : undefined,
      conversationId: targetType === 'conversation' ? targetId : undefined,
      createdAt: new Date().toISOString(),
      participants: {}
    }
    console.info('[Huddle] Created huddle ' + huddle.id + ' for ' + targetType + ':' + targetId)
  }

  huddle.participants[userId] = {
    userId,
    name: userName,
    avatarUrl,
    joinedAt: new Date().toISOString(),
    muted: false,
    speaking: false,
    cameraEnabled: false,
    screenSharing: false,
    socketId
  }

  await saveHuddle(huddle)
  console.info('[Huddle] User ' + userId + ' joined huddle ' + huddle.id + ' (' + Object.keys(huddle.participants).length + ' total)')
  return { huddle, isNew }
}

export const leaveHuddle = async (
  huddleId: string,
  userId: string
): Promise<{ huddle: HuddleState | null; destroyed: boolean }> => {
  const huddle = await getHuddleById(huddleId)
  if (!huddle) return { huddle: null, destroyed: false }

  delete huddle.participants[userId]
  console.info('[Huddle] User ' + userId + ' left huddle ' + huddleId + ' (' + Object.keys(huddle.participants).length + ' remaining)')

  if (Object.keys(huddle.participants).length === 0) {
    await deleteHuddle(huddle)
    console.info('[Huddle] Destroyed empty huddle ' + huddleId)
    return { huddle, destroyed: true }
  }

  await saveHuddle(huddle)
  return { huddle, destroyed: false }
}

export const updateParticipant = async (
  huddleId: string,
  userId: string,
  updates: Partial<Pick<HuddleParticipant, 'muted' | 'speaking' | 'cameraEnabled' | 'screenSharing'>>
): Promise<HuddleState | null> => {
  const huddle = await getHuddleById(huddleId)
  if (!huddle || !huddle.participants[userId]) return null
  huddle.participants[userId] = { ...huddle.participants[userId], ...updates }
  await saveHuddle(huddle)
  return huddle
}

export const removeParticipantBySocket = async (
  socketId: string
): Promise<{ huddle: HuddleState | null; userId: string | null; destroyed: boolean }> => {
  if (isRedisReady()) {
    const keys = await pubClient.keys('huddle:*')
    for (const key of keys) {
      if (key.startsWith('huddle:idx:')) continue
      const raw = await pubClient.get(key)
      if (!raw) continue
      const h = JSON.parse(raw) as HuddleState
      const p = Object.values(h.participants).find(x => x.socketId === socketId)
      if (p) {
        const result = await leaveHuddle(h.id, p.userId)
        return { ...result, userId: p.userId }
      }
    }
  } else {
    for (const h of inMemoryHuddles.values()) {
      const p = Object.values(h.participants).find(x => x.socketId === socketId)
      if (p) {
        const result = await leaveHuddle(h.id, p.userId)
        return { ...result, userId: p.userId }
      }
    }
  }
  return { huddle: null, userId: null, destroyed: false }
}

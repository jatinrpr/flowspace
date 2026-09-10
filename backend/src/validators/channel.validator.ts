import { z } from 'zod'

export const createChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required').max(80, 'Channel name is too long'),
  description: z.string().max(250).optional(),
  isPrivate: z.boolean().default(false),
})

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(250).optional().nullable(),
})

export const addChannelMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

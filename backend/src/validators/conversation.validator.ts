import { z } from 'zod'

export const createConversationSchema = z.object({
  type: z.enum(['DIRECT', 'GROUP']),
  name: z.string().max(80).optional(),
  memberIds: z.array(z.string()).min(1),
})

export const addConversationMemberSchema = z.object({
  userId: z.string().min(1),
})

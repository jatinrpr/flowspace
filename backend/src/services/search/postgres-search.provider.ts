import { prisma } from '../../lib/prisma.js'
import { SearchProvider, SearchResult } from './search.provider.js'
import { parseSearchQuery } from './search-parser.js'
import { Prisma } from '@prisma/client'

export class PostgresSearchProvider implements SearchProvider {
  async searchMessages(
    workspaceId: string,
    userId: string,
    query: string,
    limit: number = 20,
    cursor?: string
  ): Promise<SearchResult> {
    const parsed = parseSearchQuery(query)

    const accessibleChannels = await prisma.channel.findMany({
      where: {
        workspaceId,
        OR: [
          { isPrivate: false },
          { members: { some: { userId } } }
        ]
      },
      select: { id: true, name: true }
    })
    const accessibleChannelIds = accessibleChannels.map(c => c.id)

    const accessibleConversations = await prisma.conversation.findMany({
      where: {
        workspaceId,
        members: { some: { userId } }
      },
      select: { id: true }
    })
    const accessibleConversationIds = accessibleConversations.map(c => c.id)

    const whereCondition: Prisma.MessageWhereInput = {
      deletedAt: null,
      OR: [
        { channelId: { in: accessibleChannelIds } },
        { conversationId: { in: accessibleConversationIds } }
      ]
    }

    if (parsed.text) {
      whereCondition.content = {
        contains: parsed.text,
        mode: 'insensitive'
      }
    }

    if (parsed.in) {
      const channelMatch = accessibleChannels.find(
        c => c.name.toLowerCase() === parsed.in!.toLowerCase()
      )
      if (channelMatch) {
        whereCondition.channelId = channelMatch.id
        whereCondition.OR = undefined
      } else {
        return { results: [], nextCursor: null, hasMore: false }
      }
    }

    if (parsed.from) {
      const users = await prisma.user.findMany({
        where: {
          name: { equals: parsed.from, mode: 'insensitive' },
          workspaceMemberships: { some: { workspaceId } }
        },
        select: { id: true }
      })
      if (users.length > 0) {
        whereCondition.senderId = { in: users.map(u => u.id) }
      } else {
        return { results: [], nextCursor: null, hasMore: false }
      }
    }

    if (parsed.after || parsed.before) {
      whereCondition.createdAt = {}
      if (parsed.after) {
        whereCondition.createdAt.gte = new Date(`${parsed.after}T00:00:00.000Z`)
      }
      if (parsed.before) {
        whereCondition.createdAt.lt = new Date(`${parsed.before}T00:00:00.000Z`)
      }
    }

    if (parsed.has.length > 0) {
      const typeConditions: Prisma.MessageWhereInput[] = []
      if (parsed.has.includes('file')) {
        typeConditions.push({ files: { some: {} } })
      }
      if (parsed.has.includes('voice')) {
        typeConditions.push({ type: 'VOICE' })
      }
      
      if (typeConditions.length > 0) {
        const currentOr = whereCondition.OR
        delete whereCondition.OR
        
        whereCondition.AND = []
        if (currentOr && currentOr.length > 0) {
           whereCondition.AND.push({ OR: currentOr })
        }
        whereCondition.AND.push({ OR: typeConditions })
      }
    }

    const messages = await prisma.message.findMany({
      where: whereCondition,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        channel: { select: { id: true, name: true } },
        conversation: { select: { id: true, type: true, name: true } },
        files: true
      }
    })

    let nextCursor: string | null = null
    let hasMore = false

    if (messages.length > limit) {
      hasMore = true
      nextCursor = messages[limit]?.id || null
      messages.pop()
    }

    return {
      results: messages,
      nextCursor,
      hasMore
    }
  }
}

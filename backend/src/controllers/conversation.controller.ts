import type { RequestHandler } from 'express'
import * as conversationService from '../services/conversation.service.js'
import { createConversationSchema, addConversationMemberSchema } from '../validators/conversation.validator.js'

export const createConversation: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const input = createConversationSchema.parse(req.body)
  const conversation = await conversationService.createConversation(
    req.params.workspaceId,
    req.auth!.userId,
    input.type,
    input.memberIds,
    input.name
  )
  res.status(201).json({ success: true, conversation })
}

export const listConversations: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const conversations = await conversationService.listConversations(req.params.workspaceId, req.auth!.userId)
  res.status(200).json({ success: true, conversations })
}

export const getConversation: RequestHandler<{ conversationId: string }> = async (req, res) => {
  const conversation = await conversationService.getConversation(req.params.conversationId, req.auth!.userId)
  res.status(200).json({ success: true, conversation })
}

export const deleteConversation: RequestHandler<{ conversationId: string }> = async (req, res) => {
  await conversationService.deleteConversation(req.params.conversationId, req.auth!.userId)
  res.status(200).json({ success: true, message: 'Conversation deleted' })
}

export const addConversationMember: RequestHandler<{ conversationId: string }> = async (req, res) => {
  const input = addConversationMemberSchema.parse(req.body)
  await conversationService.addConversationMember(req.params.conversationId, input.userId, req.auth!.userId)
  res.status(201).json({ success: true, message: 'Member added' })
}

export const removeConversationMember: RequestHandler<{ conversationId: string, userId: string }> = async (req, res) => {
  await conversationService.removeConversationMember(req.params.conversationId, req.params.userId, req.auth!.userId)
  res.status(200).json({ success: true, message: 'Member removed' })
}

import type { RequestHandler } from 'express'
import * as channelService from '../services/channel.service.js'
import { createChannelSchema, updateChannelSchema, addChannelMemberSchema } from '../validators/channel.validator.js'

export const createChannel: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const input = createChannelSchema.parse(req.body)
  const channel = await channelService.createChannel(
    req.params.workspaceId,
    req.auth!.userId,
    input.name,
    input.isPrivate,
    input.description
  )
  res.status(201).json({ success: true, channel })
}

export const listChannels: RequestHandler<{ workspaceId: string }> = async (req, res) => {
  const channels = await channelService.listChannels(req.params.workspaceId, req.auth!.userId)
  res.status(200).json({ success: true, channels })
}

export const getChannel: RequestHandler<{ channelId: string }> = async (req, res) => {
  const channel = await channelService.getChannel(req.params.channelId, req.auth!.userId)
  res.status(200).json({ success: true, channel })
}

export const updateChannel: RequestHandler<{ channelId: string }> = async (req, res) => {
  const input = updateChannelSchema.parse(req.body)
  const channel = await channelService.updateChannel(req.params.channelId, input, req.auth!.userId)
  res.status(200).json({ success: true, channel })
}

export const deleteChannel: RequestHandler<{ channelId: string }> = async (req, res) => {
  await channelService.deleteChannel(req.params.channelId, req.auth!.userId)
  res.status(200).json({ success: true, message: 'Channel deleted' })
}

export const getChannelMembers: RequestHandler<{ channelId: string }> = async (req, res) => {
  const members = await channelService.getChannelMembers(req.params.channelId)
  res.status(200).json({ success: true, members })
}

export const addChannelMember: RequestHandler<{ channelId: string }> = async (req, res) => {
  const input = addChannelMemberSchema.parse(req.body)
  await channelService.addChannelMember(req.params.channelId, input.userId, req.auth!.userId)
  res.status(201).json({ success: true, message: 'Member added' })
}

export const removeChannelMember: RequestHandler<{ channelId: string, userId: string }> = async (req, res) => {
  await channelService.removeChannelMember(
    req.params.channelId,
    req.params.userId,
    req.auth!.userId
  )
  res.status(200).json({ success: true, message: 'Member removed' })
}

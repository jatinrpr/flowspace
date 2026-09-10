import { RequestHandler } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../lib/prisma.js'
import { io } from '../sockets/index.js'

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const fileName = `${uuidv4()}${ext}`
    cb(null, fileName)
  }
})

export const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
})

export const uploadFile: RequestHandler<{ messageId: string }> = async (req, res, next) => {
  try {
    const file = req.file
    if (!file) {
      res.status(400).json({ success: false, error: 'No file uploaded' })
      return
    }

    const { messageId } = req.params
    const userId = req.auth!.userId

    // Basic authorization: Verify message exists and user is sender
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      res.status(404).json({ success: false, error: 'Message not found' })
      return
    }

    if (message.senderId !== userId) {
      res.status(403).json({ success: false, error: 'Forbidden' })
      return
    }

    const fileRecord = await prisma.file.create({
      data: {
        messageId,
        originalName: file.originalname,
        storageKey: file.filename,
        url: `/uploads/${file.filename}`, // In a real app this would be a full URL/CDN
        mimeType: file.mimetype,
        size: file.size
      }
    })

    // Broadcast file to the channel/conversation
    const broadcastPayload = {
      messageId,
      file: fileRecord,
      roomId: message.channelId || message.conversationId
    }
    
    if (message.channelId) {
      io.to(`channel:${message.channelId}`).emit('file:uploaded', broadcastPayload)
    } else if (message.conversationId) {
      io.to(`conversation:${message.conversationId}`).emit('file:uploaded', broadcastPayload)
    }

    res.status(201).json({ success: true, file: fileRecord })
  } catch (error) {
    next(error)
  }
}

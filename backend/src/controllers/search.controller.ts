import { Request, Response, NextFunction } from 'express'
import { searchMessages } from '../services/search/search.service.js'
import { prisma } from '../lib/prisma.js'

export const handleSearchMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, limit, cursor } = req.query
    const workspaceId = typeof req.params.workspaceId === 'string' ? req.params.workspaceId : ''
    const userId = req.auth!.userId

    if (!workspaceId) {
      res.status(400).json({ success: false, error: 'Workspace ID is required' })
      return
    }

    if (!q || typeof q !== 'string') {
      res.status(400).json({ success: false, error: 'Query parameter q is required and must be a string' })
      return
    }

    const queryString = q

    // Verify user is in workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId }
      }
    })

    if (!membership) {
      res.status(403).json({ success: false, error: 'Forbidden' })
      return
    }

    let parsedLimit = 20
    if (typeof limit === 'string') {
      parsedLimit = parseInt(limit, 10)
      if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
        parsedLimit = 20
      }
    }

    const cursorString = typeof cursor === 'string' ? cursor : undefined

    const result = await searchMessages(
      workspaceId,
      userId,
      queryString,
      parsedLimit,
      cursorString
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

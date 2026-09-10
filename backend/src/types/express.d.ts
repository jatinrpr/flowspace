declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
      }
      workspaceMember?: import('@prisma/client').WorkspaceMember
    }
  }
}

export {}

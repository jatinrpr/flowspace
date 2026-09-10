-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'AWAY', 'OFFLINE');
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'VOICE');
CREATE TYPE "NotificationType" AS ENUM ('MESSAGE', 'MENTION', 'CHANNEL', 'THREAD', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL, "avatarUrl" TEXT, "status" "UserStatus" NOT NULL DEFAULT 'OFFLINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ChannelMember" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChannelMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Message" (
    "id" TEXT NOT NULL, "senderId" TEXT NOT NULL, "channelId" TEXT, "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT', "threadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3), CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL, "rootMessageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL, "messageId" TEXT NOT NULL, "userId" TEXT NOT NULL, "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "File" (
    "id" TEXT NOT NULL, "messageId" TEXT NOT NULL, "originalName" TEXT NOT NULL, "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "type" "NotificationType" NOT NULL, "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");
CREATE INDEX "Channel_workspaceId_idx" ON "Channel"("workspaceId");
CREATE UNIQUE INDEX "Channel_workspaceId_name_key" ON "Channel"("workspaceId", "name");
CREATE INDEX "ChannelMember_channelId_idx" ON "ChannelMember"("channelId");
CREATE INDEX "ChannelMember_userId_idx" ON "ChannelMember"("userId");
CREATE UNIQUE INDEX "ChannelMember_userId_channelId_key" ON "ChannelMember"("userId", "channelId");
CREATE INDEX "Message_channelId_createdAt_idx" ON "Message"("channelId", "createdAt");
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE UNIQUE INDEX "Thread_rootMessageId_key" ON "Thread"("rootMessageId");
CREATE INDEX "Reaction_messageId_idx" ON "Reaction"("messageId");
CREATE UNIQUE INDEX "Reaction_messageId_userId_emoji_key" ON "Reaction"("messageId", "userId", "emoji");
CREATE UNIQUE INDEX "File_storageKey_key" ON "File"("storageKey");
CREATE INDEX "File_messageId_idx" ON "File"("messageId");
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChannelMember" ADD CONSTRAINT "ChannelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChannelMember" ADD CONSTRAINT "ChannelMember_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_rootMessageId_fkey" FOREIGN KEY ("rootMessageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "File" ADD CONSTRAINT "File_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

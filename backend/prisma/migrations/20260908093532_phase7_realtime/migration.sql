-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "clientMessageId" TEXT;

-- CreateTable
CREATE TABLE "MessageReadState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT,
    "conversationId" TEXT,
    "lastReadMessageId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageReadState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageReadState_userId_idx" ON "MessageReadState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReadState_userId_channelId_key" ON "MessageReadState"("userId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReadState_userId_conversationId_key" ON "MessageReadState"("userId", "conversationId");

-- CreateIndex
CREATE INDEX "Message_clientMessageId_idx" ON "Message"("clientMessageId");

-- AddForeignKey
ALTER TABLE "MessageReadState" ADD CONSTRAINT "MessageReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReadState" ADD CONSTRAINT "MessageReadState_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReadState" ADD CONSTRAINT "MessageReadState_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReadState" ADD CONSTRAINT "MessageReadState_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CONFIRMED', 'IN_SESSION', 'EXPIRED');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "sessionId" TEXT,
    "requesterReady" BOOLEAN NOT NULL DEFAULT false,
    "receiverReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_requesterId_status_idx" ON "Match"("requesterId", "status");

-- CreateIndex
CREATE INDEX "Match_receiverId_status_idx" ON "Match"("receiverId", "status");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

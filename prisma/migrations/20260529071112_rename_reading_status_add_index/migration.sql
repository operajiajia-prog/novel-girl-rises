/*
  Warnings:

  - You are about to drop the `ReadingStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReadingStatus" DROP CONSTRAINT "ReadingStatus_bookId_fkey";

-- DropForeignKey
ALTER TABLE "ReadingStatus" DROP CONSTRAINT "ReadingStatus_userId_fkey";

-- DropTable
DROP TABLE "ReadingStatus";

-- CreateTable
CREATE TABLE "ReadingNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "statusText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingNote_userId_bookId_key" ON "ReadingNote"("userId", "bookId");

-- CreateIndex
CREATE INDEX "ActivityFeed_userId_createdAt_idx" ON "ActivityFeed"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ReadingNote" ADD CONSTRAINT "ReadingNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingNote" ADD CONSTRAINT "ReadingNote_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

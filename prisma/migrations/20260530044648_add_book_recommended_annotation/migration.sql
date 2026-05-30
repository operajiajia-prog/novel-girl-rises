/*
  Warnings:

  - You are about to drop the column `userNotes` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `readerBgColor` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `readerFontSize` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `readerLineHeight` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Bookmark` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'BOOK_RECOMMENDED';

-- DropForeignKey
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_bookId_fkey";

-- DropForeignKey
ALTER TABLE "Bookmark" DROP CONSTRAINT "Bookmark_userId_fkey";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "userNotes";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "readerBgColor",
DROP COLUMN "readerFontSize",
DROP COLUMN "readerLineHeight";

-- DropTable
DROP TABLE "Bookmark";

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "chapterIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Annotation_userId_bookId_idx" ON "Annotation"("userId", "bookId");

-- CreateIndex
CREATE INDEX "Annotation_userId_bookId_chapterIndex_idx" ON "Annotation"("userId", "bookId", "chapterIndex");

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

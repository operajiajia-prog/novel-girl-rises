-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userNotes" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "readerBgColor" TEXT NOT NULL DEFAULT 'dark',
ADD COLUMN     "readerFontSize" INTEGER NOT NULL DEFAULT 17,
ADD COLUMN     "readerLineHeight" TEXT NOT NULL DEFAULT 'normal';

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "chapterIndex" INTEGER NOT NULL,
    "charOffset" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_bookId_chapterIndex_charOffset_key" ON "Bookmark"("userId", "bookId", "chapterIndex", "charOffset");

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

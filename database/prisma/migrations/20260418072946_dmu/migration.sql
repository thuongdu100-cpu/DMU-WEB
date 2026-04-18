-- AlterTable
ALTER TABLE "articles" ALTER COLUMN "published_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "is_hero" BOOLEAN NOT NULL DEFAULT false;

-- RenameIndex
ALTER INDEX "articles_published_idx" RENAME TO "articles_published_at_idx";

-- RenameIndex
ALTER INDEX "articles_updated_idx" RENAME TO "articles_updated_at_idx";

-- Add WordPress mirror fields to ContentPost. Nullable → safe on existing rows.
ALTER TABLE "ContentPost" ADD COLUMN "wordpressPostId" TEXT;
ALTER TABLE "ContentPost" ADD COLUMN "wordpressUrl" TEXT;
ALTER TABLE "ContentPost" ADD COLUMN "wordpressStatus" TEXT;

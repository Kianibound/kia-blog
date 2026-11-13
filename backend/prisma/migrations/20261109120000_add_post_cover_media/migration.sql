-- Optional article cover: a single server-managed Media reference plus alt text.
-- The restrictive foreign key protects cover-referenced Media from deletion,
-- mirroring the body-image reference integrity rule.
ALTER TABLE "Post" ADD COLUMN "coverMediaId" TEXT;
ALTER TABLE "Post" ADD COLUMN "coverAlt" TEXT;
CREATE INDEX "Post_coverMediaId_idx" ON "Post"("coverMediaId");
ALTER TABLE "Post" ADD CONSTRAINT "Post_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

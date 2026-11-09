-- Comment moderation states (Issue #54).
-- New comments default to PENDING and stay hidden from public reads until an
-- ADMIN approves them (Issue #55).
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED');

ALTER TABLE "Comment" ADD COLUMN "status" "CommentStatus" NOT NULL DEFAULT 'PENDING';

-- Migration policy: every comment that existed before moderation was already
-- publicly visible, so it is grandfathered as APPROVED to preserve behavior.
-- Nothing is deleted or rewritten except the new column.
UPDATE "Comment" SET "status" = 'APPROVED';

CREATE INDEX "Comment_status_idx" ON "Comment"("status");

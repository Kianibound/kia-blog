-- Optimistic version for ADMIN comment approval (Issue #55).
-- Additive: existing rows start at version 1 and keep their current status.
ALTER TABLE "Comment" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

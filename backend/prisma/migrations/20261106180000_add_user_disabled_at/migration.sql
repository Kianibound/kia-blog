-- Existing accounts remain enabled. No refresh-token records are changed.
ALTER TABLE "User" ADD COLUMN "disabledAt" TIMESTAMP(3);

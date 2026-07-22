-- Mirror GHL tasks into the local FollowUpTask table. Store the GoHighLevel task
-- id so completion can sync both ways and webhook events reconcile by exact id.
-- Nullable: a task created locally but not yet pushed to GHL has no id (backfilled
-- by the sync retry). Unique so an id maps to at most one local task.
-- AlterTable
ALTER TABLE "FollowUpTask" ADD COLUMN "ghlTaskId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpTask_ghlTaskId_key" ON "FollowUpTask"("ghlTaskId");

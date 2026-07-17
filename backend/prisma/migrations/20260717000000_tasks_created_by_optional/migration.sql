-- Make FollowUpTask.createdById optional so system-generated tasks
-- (auto-created on lead intake, with no authenticated author) can be stored.
ALTER TABLE "FollowUpTask" ALTER COLUMN "createdById" DROP NOT NULL;

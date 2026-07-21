-- Add the 6th public lead form (general "Contact" form) to the LeadSource enum.
-- Mirrors the existing verticals; the contact form syncs to GHL as a tagged
-- contact (tag "contact") with its own custom fields — no dedicated pipeline.
-- AlterEnum
ALTER TYPE "LeadSource" ADD VALUE 'CONTACT';

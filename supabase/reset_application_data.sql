-- Reset workflow/application data while keeping accounts and setup records.
-- Safe for "start over" demos or test cycles.
--
-- This clears:
-- - assessment center assignments
-- - application-linked notifications
-- - submission workflow history
-- - applicant application submissions
-- - room memberships and join attempts
--
-- This does NOT clear:
-- - profiles
-- - auth.users
-- - rooms
-- - assessment_centers

begin;

-- Assignments reference submission ids as text, so clear them first.
delete from public.assessment_center_applicants;

-- Remove notifications tied to application workflow.
delete from public.portal_notifications
where submission_id is not null;

-- Remove submission history before clearing the submissions themselves.
delete from public.application_submission_events;

-- Remove all application records.
delete from public.applicant_application_submissions;

-- Optional fresh-room cleanup for testing/demo resets.
delete from public.room_members;
delete from public.room_join_attempts;

commit;

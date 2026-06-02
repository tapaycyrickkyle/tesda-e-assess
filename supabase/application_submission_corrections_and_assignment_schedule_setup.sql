alter table public.applicant_application_submissions
drop constraint if exists applicant_application_submissions_workflow_status_check;

alter table public.applicant_application_submissions
add constraint applicant_application_submissions_workflow_status_check
check (
  workflow_status in (
    'draft',
    'submitted_to_teacher',
    'submitted_to_admin',
    'needs_applicant_update',
    'assigned',
    'under_review',
    'for_result_encoding',
    'passed',
    'not_passed',
    'completed',
    'rejected',
    'cancelled',
    'withdrawn'
  )
);

alter table public.assessment_center_applicants
add column if not exists assessment_date date,
add column if not exists assessor text,
add column if not exists assignment_group_key text,
add column if not exists assignment_group_number integer,
add column if not exists schedule_updated_at timestamptz not null default now(),
add column if not exists schedule_updated_by uuid,
add column if not exists schedule_updated_by_email text;

update public.assessment_center_applicants
set schedule_updated_at = assigned_at
where schedule_updated_at is null;

create index if not exists assessment_center_applicants_group_key_idx
on public.assessment_center_applicants (assignment_group_key);

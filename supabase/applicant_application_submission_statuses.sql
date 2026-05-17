alter table public.applicant_application_submissions
drop constraint if exists applicant_application_submissions_workflow_status_check;

alter table public.applicant_application_submissions
add constraint applicant_application_submissions_workflow_status_check
check (
  workflow_status in (
    'draft',
    'submitted_to_teacher',
    'submitted_to_admin',
    'assigned',
    'under_review',
    'completed',
    'rejected',
    'cancelled',
    'withdrawn'
  )
);

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.applicant_application_submissions'::regclass
      and tgname = 'applicant_application_submissions_guard_write'
      and not tgisinternal
  ) then
    alter table public.applicant_application_submissions
    disable trigger applicant_application_submissions_guard_write;
  end if;
end $$;

update public.applicant_application_submissions
set workflow_status = 'under_review'
where workflow_status = 'assigned';

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.applicant_application_submissions'::regclass
      and tgname = 'applicant_application_submissions_guard_write'
      and not tgisinternal
  ) then
    alter table public.applicant_application_submissions
    enable trigger applicant_application_submissions_guard_write;
  end if;
end $$;

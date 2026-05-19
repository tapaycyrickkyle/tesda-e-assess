alter table public.applicant_application_submissions
  add column if not exists latest_status_reason text;

alter table public.applicant_application_submissions
  add column if not exists latest_status_updated_at timestamptz;

alter table public.applicant_application_submissions
  disable trigger applicant_application_submissions_guard_write;

update public.applicant_application_submissions
set latest_status_updated_at = coalesce(latest_status_updated_at, updated_at, submitted_at, created_at, now());

alter table public.applicant_application_submissions
  enable trigger applicant_application_submissions_guard_write;

create table if not exists public.application_submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.applicant_application_submissions(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  reason text,
  actor_user_id uuid,
  actor_email text,
  actor_role text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists application_submission_events_submission_idx
on public.application_submission_events (submission_id, created_at desc);

create table if not exists public.portal_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid,
  recipient_email text not null,
  recipient_role text not null,
  title text not null,
  message text not null,
  notification_type text not null default 'info',
  submission_id uuid references public.applicant_application_submissions(id) on delete cascade,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists portal_notifications_recipient_idx
on public.portal_notifications (recipient_email, recipient_role, is_read, created_at desc);

create index if not exists portal_notifications_submission_idx
on public.portal_notifications (submission_id, created_at desc);

alter table public.application_submission_events enable row level security;
alter table public.portal_notifications enable row level security;

drop policy if exists "applicants_select_own_submission_events" on public.application_submission_events;
create policy "applicants_select_own_submission_events"
on public.application_submission_events
for select
to authenticated
using (
  exists (
    select 1
    from public.applicant_application_submissions
    where applicant_application_submissions.id = application_submission_events.submission_id
      and applicant_application_submissions.applicant_id = auth.uid()
  )
);

drop policy if exists "teachers_select_room_submission_events" on public.application_submission_events;
create policy "teachers_select_room_submission_events"
on public.application_submission_events
for select
to authenticated
using (
  exists (
    select 1
    from public.applicant_application_submissions
    join public.rooms on rooms.id = applicant_application_submissions.room_id
    where applicant_application_submissions.id = application_submission_events.submission_id
      and rooms.teacher_id = auth.uid()
  )
);

drop policy if exists "assessment_centers_select_assigned_submission_events" on public.application_submission_events;
create policy "assessment_centers_select_assigned_submission_events"
on public.application_submission_events
for select
to authenticated
using (
  exists (
    select 1
    from public.assessment_center_applicants
    join public.assessment_centers
      on assessment_centers.id = assessment_center_applicants.assessment_center_id
    where assessment_center_applicants.applicant_reference = application_submission_events.submission_id::text
      and (
        assessment_centers.center_auth_user_id = auth.uid()
        or lower(coalesce(assessment_centers.center_email, '')) = lower(auth.email())
      )
  )
);

drop policy if exists "admins_select_submission_events" on public.application_submission_events;
create policy "admins_select_submission_events"
on public.application_submission_events
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admins_insert_submission_events" on public.application_submission_events;
create policy "admins_insert_submission_events"
on public.application_submission_events
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "users_select_own_portal_notifications" on public.portal_notifications;
create policy "users_select_own_portal_notifications"
on public.portal_notifications
for select
to authenticated
using (
  auth.uid() = recipient_user_id
  or lower(recipient_email) = lower(auth.email())
);

drop policy if exists "users_update_own_portal_notifications" on public.portal_notifications;
create policy "users_update_own_portal_notifications"
on public.portal_notifications
for update
to authenticated
using (
  auth.uid() = recipient_user_id
  or lower(recipient_email) = lower(auth.email())
)
with check (
  auth.uid() = recipient_user_id
  or lower(recipient_email) = lower(auth.email())
);

drop policy if exists "admins_insert_portal_notifications" on public.portal_notifications;
create policy "admins_insert_portal_notifications"
on public.portal_notifications
for insert
to authenticated
with check (public.is_admin_user());

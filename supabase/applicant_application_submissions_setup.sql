create table if not exists public.applicant_application_submissions (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null,
  applicant_email text not null,
  room_id uuid references public.rooms(id) on delete set null,
  submission_source text not null check (submission_source in ('individual', 'room')),
  workflow_status text not null check (workflow_status in ('submitted_to_teacher', 'submitted_to_admin')),
  applicant_name text not null,
  qualification_title text not null,
  qualification_type text not null,
  contact_number text,
  form_data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  teacher_forwarded_at timestamptz,
  teacher_forwarded_by uuid,
  teacher_forwarded_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop index if exists public.applicant_application_submissions_individual_unique_idx;
drop index if exists public.applicant_application_submissions_room_unique_idx;

create index if not exists applicant_application_submissions_applicant_idx
on public.applicant_application_submissions (applicant_id);

create index if not exists applicant_application_submissions_applicant_room_idx
on public.applicant_application_submissions (applicant_id, room_id);

alter table public.applicant_application_submissions enable row level security;

drop policy if exists "students_select_own_application_submissions" on public.applicant_application_submissions;
create policy "students_select_own_application_submissions"
on public.applicant_application_submissions
for select
to authenticated
using (auth.uid() = applicant_id);

drop policy if exists "students_insert_own_application_submissions" on public.applicant_application_submissions;
create policy "students_insert_own_application_submissions"
on public.applicant_application_submissions
for insert
to authenticated
with check (auth.uid() = applicant_id);

drop policy if exists "students_update_own_application_submissions" on public.applicant_application_submissions;
create policy "students_update_own_application_submissions"
on public.applicant_application_submissions
for update
to authenticated
using (auth.uid() = applicant_id)
with check (auth.uid() = applicant_id);

drop policy if exists "teachers_select_room_application_submissions" on public.applicant_application_submissions;
create policy "teachers_select_room_application_submissions"
on public.applicant_application_submissions
for select
to authenticated
using (
  room_id is not null
  and exists (
    select 1
    from public.rooms
    where rooms.id = applicant_application_submissions.room_id
      and rooms.teacher_id = auth.uid()
  )
);

drop policy if exists "teachers_update_room_application_submissions" on public.applicant_application_submissions;
create policy "teachers_update_room_application_submissions"
on public.applicant_application_submissions
for update
to authenticated
using (
  room_id is not null
  and exists (
    select 1
    from public.rooms
    where rooms.id = applicant_application_submissions.room_id
      and rooms.teacher_id = auth.uid()
  )
)
with check (
  room_id is not null
  and exists (
    select 1
    from public.rooms
    where rooms.id = applicant_application_submissions.room_id
      and rooms.teacher_id = auth.uid()
  )
);

drop policy if exists "admins_select_application_submissions" on public.applicant_application_submissions;
create policy "admins_select_application_submissions"
on public.applicant_application_submissions
for select
to authenticated
using (public.is_admin_user());

update public.applicant_application_submissions
set form_data = form_data - 'uliNumber'
where form_data ? 'uliNumber';

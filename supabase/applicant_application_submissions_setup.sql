create table if not exists public.applicant_application_submissions (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null,
  applicant_email text not null,
  room_id uuid references public.rooms(id) on delete set null,
  submission_source text not null check (submission_source in ('individual', 'room')),
  workflow_status text not null check (workflow_status in ('draft', 'submitted_to_teacher', 'submitted_to_admin', 'assigned', 'under_review', 'completed', 'rejected', 'cancelled', 'withdrawn')),
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

create or replace function public.guard_application_submission_write()
returns trigger
language plpgsql
as $$
declare
  owns_room boolean;
begin
  if auth.role() = 'service_role' or public.is_admin_user() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() <> new.applicant_id then
      raise exception 'Applicants can only create their own submissions.';
    end if;

    if new.room_id is null then
      if new.submission_source <> 'individual' or new.workflow_status <> 'submitted_to_admin' then
        raise exception 'Individual submissions must go directly to TESDA.';
      end if;
    else
      if new.submission_source <> 'room' or new.workflow_status <> 'submitted_to_teacher' then
        raise exception 'Room submissions must go to the teacher first.';
      end if;

      if not exists (
        select 1
        from public.room_members
        where room_members.room_id = new.room_id
          and room_members.applicant_id = auth.uid()
      ) then
        raise exception 'Applicants can only submit to rooms they joined.';
      end if;
    end if;

    return new;
  end if;

  if auth.uid() = old.applicant_id then
    if new.applicant_id <> old.applicant_id then
      raise exception 'Applicant ownership cannot be changed.';
    end if;

    if lower(coalesce(new.applicant_email, '')) <> lower(coalesce(old.applicant_email, '')) then
      raise exception 'Applicant email cannot be changed here.';
    end if;

    if coalesce(new.room_id::text, '') <> coalesce(old.room_id::text, '') then
      raise exception 'Submission route cannot be changed.';
    end if;

    if new.submission_source <> old.submission_source then
      raise exception 'Submission source cannot be changed.';
    end if;

    if coalesce(new.teacher_forwarded_at::text, '') <> coalesce(old.teacher_forwarded_at::text, '') then
      raise exception 'Teacher forwarding timestamps cannot be changed by applicants.';
    end if;

    if coalesce(new.teacher_forwarded_by::text, '') <> coalesce(old.teacher_forwarded_by::text, '') then
      raise exception 'Teacher forwarding metadata cannot be changed by applicants.';
    end if;

    if lower(coalesce(new.teacher_forwarded_by_email, '')) <> lower(coalesce(old.teacher_forwarded_by_email, '')) then
      raise exception 'Teacher forwarding metadata cannot be changed by applicants.';
    end if;

    if old.submission_source = 'room' and old.workflow_status = 'submitted_to_admin' then
      raise exception 'Forwarded room submissions can no longer be edited by applicants.';
    end if;

    if old.submission_source = 'room' and new.workflow_status <> 'submitted_to_teacher' then
      raise exception 'Room submissions must stay in the teacher queue while edited by applicants.';
    end if;

    if old.submission_source = 'individual' and new.workflow_status <> 'submitted_to_admin' then
      raise exception 'Individual submissions must stay in the TESDA queue while edited by applicants.';
    end if;

    return new;
  end if;

  if old.room_id is not null then
    select exists (
      select 1
      from public.rooms
      where rooms.id = old.room_id
        and rooms.teacher_id = auth.uid()
    )
    into owns_room;

    if owns_room then
      if new.id <> old.id
        or new.applicant_id <> old.applicant_id
        or lower(coalesce(new.applicant_email, '')) <> lower(coalesce(old.applicant_email, ''))
        or coalesce(new.room_id::text, '') <> coalesce(old.room_id::text, '')
        or new.submission_source <> old.submission_source
        or new.applicant_name <> old.applicant_name
        or new.qualification_title <> old.qualification_title
        or new.qualification_type <> old.qualification_type
        or coalesce(new.contact_number, '') <> coalesce(old.contact_number, '')
        or new.form_data <> old.form_data
        or new.submitted_at <> old.submitted_at
        or old.workflow_status <> 'submitted_to_teacher'
        or new.workflow_status <> 'submitted_to_admin'
        or new.teacher_forwarded_by <> auth.uid()
        or lower(coalesce(new.teacher_forwarded_by_email, '')) <> lower(coalesce(auth.email(), ''))
        or new.teacher_forwarded_at is null
      then
        raise exception 'Teachers can only forward joined room submissions to TESDA.';
      end if;

      return new;
    end if;
  end if;

  raise exception 'This submission update is not allowed for the current account.';
end;
$$;

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
with check (
  auth.uid() = applicant_id
  and (
    (room_id is null and submission_source = 'individual' and workflow_status = 'submitted_to_admin')
    or (
      room_id is not null
      and submission_source = 'room'
      and workflow_status = 'submitted_to_teacher'
      and exists (
        select 1
        from public.room_members
        where room_members.room_id = applicant_application_submissions.room_id
          and room_members.applicant_id = auth.uid()
      )
    )
  )
);

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

drop trigger if exists applicant_application_submissions_guard_write on public.applicant_application_submissions;

update public.applicant_application_submissions
set form_data = form_data - 'uliNumber'
where form_data ? 'uliNumber';

update public.applicant_application_submissions
set workflow_status = 'under_review'
where workflow_status = 'assigned';

create trigger applicant_application_submissions_guard_write
before insert or update on public.applicant_application_submissions
for each row
execute function public.guard_application_submission_write();

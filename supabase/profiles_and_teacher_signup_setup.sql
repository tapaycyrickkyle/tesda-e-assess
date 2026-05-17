create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null,
  full_name text,
  first_name text,
  middle_name text,
  last_name text,
  contact_number text,
  institution_name text,
  institution_type text,
  position_title text,
  approval_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists middle_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists contact_number text;
alter table public.profiles add column if not exists institution_name text;
alter table public.profiles add column if not exists institution_type text;
alter table public.profiles add column if not exists position_title text;
alter table public.profiles add column if not exists approval_status text not null default 'active';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

update public.profiles
set email = lower(email)
where email is not null and email <> lower(email);

update public.profiles
set role = 'applicant'
where role = 'student';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_email_key'
  ) then
    alter table public.profiles
    add constraint profiles_email_key unique (email);
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (
  role = any (
    array[
      'admin'::text,
      'applicant'::text,
      'teacher'::text,
      'assessment_center'::text
    ]
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Canonical shared admin helper. Other setup scripts should depend on this
-- function instead of redefining it so the logic stays in one place.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role'
    ) = 'admin'
    or exists (
      select 1
      from public.profiles
      where lower(profiles.email) = lower(auth.email())
        and lower(coalesce(profiles.role, '')) like '%admin%'
    );
$$;

create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' or public.is_admin_user() then
    return new;
  end if;

  if new.id <> old.id then
    raise exception 'Profile id cannot be changed.';
  end if;

  if lower(coalesce(new.email, '')) <> lower(coalesce(old.email, '')) then
    raise exception 'Profile email cannot be changed here.';
  end if;

  if lower(coalesce(new.role, '')) <> lower(coalesce(old.role, '')) then
    raise exception 'Profile role cannot be changed here.';
  end if;

  if lower(coalesce(new.approval_status, '')) <> lower(coalesce(old.approval_status, '')) then
    raise exception 'Profile approval status cannot be changed here.';
  end if;

  return new;
end;
$$;

alter table public.profiles enable row level security;

drop policy if exists "users_select_own_profile" on public.profiles;
create policy "users_select_own_profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or lower(email) = lower(auth.email()));

drop policy if exists "users_update_own_profile" on public.profiles;
create policy "users_update_own_profile"
on public.profiles
for update
to authenticated
using (id = auth.uid() or lower(email) = lower(auth.email()))
with check (id = auth.uid() or lower(email) = lower(auth.email()));

drop policy if exists "admins_select_profiles" on public.profiles;
create policy "admins_select_profiles"
on public.profiles
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admins_update_profiles" on public.profiles;
create policy "admins_update_profiles"
on public.profiles
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop trigger if exists profiles_guard_sensitive_fields on public.profiles;
create trigger profiles_guard_sensitive_fields
before update on public.profiles
for each row
execute function public.guard_profile_self_update();

create table if not exists public.teacher_registration_requests (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  full_name text not null,
  contact_number text not null,
  institution_name text not null,
  institution_type text not null check (institution_type in ('public', 'private')),
  position_title text not null,
  verification_document_name text not null,
  verification_document_path text not null,
  verification_document_mime_type text,
  approval_status text not null default 'pending_review' check (approval_status in ('pending_review', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_user_id)
);

alter table public.teacher_registration_requests add column if not exists verification_document_mime_type text;
alter table public.teacher_registration_requests add column if not exists approval_status text not null default 'pending_review';
alter table public.teacher_registration_requests add column if not exists created_at timestamptz not null default now();
alter table public.teacher_registration_requests add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'teacher_registration_requests_email_key'
  ) then
    alter table public.teacher_registration_requests
    add constraint teacher_registration_requests_email_key unique (email);
  end if;
end $$;

create unique index if not exists teacher_registration_requests_document_path_key
on public.teacher_registration_requests (verification_document_path);

drop trigger if exists teacher_registration_requests_set_updated_at on public.teacher_registration_requests;
create trigger teacher_registration_requests_set_updated_at
before update on public.teacher_registration_requests
for each row
execute function public.set_updated_at();

alter table public.teacher_registration_requests enable row level security;

drop policy if exists "teachers_select_own_registration_request" on public.teacher_registration_requests;
create policy "teachers_select_own_registration_request"
on public.teacher_registration_requests
for select
to authenticated
using (auth_user_id = auth.uid() or lower(email) = lower(auth.email()));

drop policy if exists "admins_select_teacher_registration_requests" on public.teacher_registration_requests;
create policy "admins_select_teacher_registration_requests"
on public.teacher_registration_requests
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admins_update_teacher_registration_requests" on public.teacher_registration_requests;
create policy "admins_update_teacher_registration_requests"
on public.teacher_registration_requests
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'teacher-verification-docs',
  'teacher-verification-docs',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

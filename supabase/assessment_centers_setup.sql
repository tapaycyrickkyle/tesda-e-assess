create table if not exists public.assessment_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  manager text not null,
  contact text not null,
  center_email text,
  center_auth_user_id uuid,
  created_by uuid not null,
  created_by_email text not null,
  created_at timestamptz not null default now()
);

alter table public.assessment_centers add column if not exists center_email text;
alter table public.assessment_centers add column if not exists center_auth_user_id uuid;

create unique index if not exists assessment_centers_center_email_key
on public.assessment_centers (lower(center_email))
where center_email is not null;

create unique index if not exists assessment_centers_center_auth_user_id_key
on public.assessment_centers (center_auth_user_id)
where center_auth_user_id is not null;

alter table public.assessment_centers enable row level security;

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

drop policy if exists "admins_select_assessment_centers" on public.assessment_centers;
create policy "admins_select_assessment_centers"
on public.assessment_centers
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admins_insert_assessment_centers" on public.assessment_centers;
create policy "admins_insert_assessment_centers"
on public.assessment_centers
for insert
to authenticated
with check (
  public.is_admin_user()
  and auth.uid() = created_by
);

drop policy if exists "admins_update_assessment_centers" on public.assessment_centers;
create policy "admins_update_assessment_centers"
on public.assessment_centers
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "admins_delete_assessment_centers" on public.assessment_centers;
create policy "admins_delete_assessment_centers"
on public.assessment_centers
for delete
to authenticated
using (public.is_admin_user());

drop policy if exists "assessment_centers_select_own_center" on public.assessment_centers;
create policy "assessment_centers_select_own_center"
on public.assessment_centers
for select
to authenticated
using (
  center_auth_user_id = auth.uid()
  or lower(coalesce(center_email, '')) = lower(auth.email())
);

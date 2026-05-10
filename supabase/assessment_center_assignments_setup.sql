create table if not exists public.assessment_center_applicants (
  id uuid primary key default gen_random_uuid(),
  assessment_center_id uuid not null references public.assessment_centers(id) on delete cascade,
  applicant_reference text not null,
  applicant_name text not null,
  qualification text not null,
  assignment_batch text,
  assigned_by uuid not null,
  assigned_by_email text not null,
  assigned_at timestamptz not null default now(),
  unique (assessment_center_id, applicant_reference)
);

alter table public.assessment_center_applicants enable row level security;

drop policy if exists "admins_select_assessment_center_assignments" on public.assessment_center_applicants;
create policy "admins_select_assessment_center_assignments"
on public.assessment_center_applicants
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "admins_insert_assessment_center_assignments" on public.assessment_center_applicants;
create policy "admins_insert_assessment_center_assignments"
on public.assessment_center_applicants
for insert
to authenticated
with check (public.is_admin_user() and auth.uid() = assigned_by);

drop policy if exists "admins_update_assessment_center_assignments" on public.assessment_center_applicants;
create policy "admins_update_assessment_center_assignments"
on public.assessment_center_applicants
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "admins_delete_assessment_center_assignments" on public.assessment_center_applicants;
create policy "admins_delete_assessment_center_assignments"
on public.assessment_center_applicants
for delete
to authenticated
using (public.is_admin_user());

drop policy if exists "assessment_centers_select_own_assignments" on public.assessment_center_applicants;
create policy "assessment_centers_select_own_assignments"
on public.assessment_center_applicants
for select
to authenticated
using (
  exists (
    select 1
    from public.assessment_centers
    where assessment_centers.id = assessment_center_applicants.assessment_center_id
      and (
        assessment_centers.center_auth_user_id = auth.uid()
        or lower(coalesce(assessment_centers.center_email, '')) = lower(auth.email())
      )
  )
);

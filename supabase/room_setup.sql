create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null,
  teacher_email text not null,
  name text not null,
  qualification text not null,
  join_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  applicant_id uuid not null,
  applicant_email text not null,
  joined_at timestamptz not null default now(),
  unique (room_id, applicant_id)
);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

drop policy if exists "teachers_select_own_rooms" on public.rooms;
create policy "teachers_select_own_rooms"
on public.rooms
for select
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "teachers_insert_own_rooms" on public.rooms;
create policy "teachers_insert_own_rooms"
on public.rooms
for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "teachers_update_own_rooms" on public.rooms;
create policy "teachers_update_own_rooms"
on public.rooms
for update
to authenticated
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

drop policy if exists "teachers_delete_own_rooms" on public.rooms;
create policy "teachers_delete_own_rooms"
on public.rooms
for delete
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "students_select_active_rooms_by_code" on public.rooms;
create policy "students_select_active_rooms_by_code"
on public.rooms
for select
to authenticated
using (is_active = true);

drop policy if exists "students_select_own_memberships" on public.room_members;
create policy "students_select_own_memberships"
on public.room_members
for select
to authenticated
using (auth.uid() = applicant_id);

drop policy if exists "students_insert_own_memberships" on public.room_members;
create policy "students_insert_own_memberships"
on public.room_members
for insert
to authenticated
with check (auth.uid() = applicant_id);

drop policy if exists "teachers_select_members_for_owned_rooms" on public.room_members;
create policy "teachers_select_members_for_owned_rooms"
on public.room_members
for select
to authenticated
using (
  exists (
    select 1
    from public.rooms
    where rooms.id = room_members.room_id
      and rooms.teacher_id = auth.uid()
  )
);

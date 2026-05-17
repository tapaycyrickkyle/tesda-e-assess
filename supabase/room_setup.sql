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

create table if not exists public.room_join_attempts (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users(id) on delete cascade,
  attempted_code text not null,
  was_success boolean not null default false,
  attempted_at timestamptz not null default now()
);

alter table public.rooms add column if not exists teacher_id uuid;
alter table public.rooms add column if not exists teacher_email text;
alter table public.rooms add column if not exists name text;
alter table public.rooms add column if not exists qualification text;
alter table public.rooms add column if not exists join_code text;
alter table public.rooms add column if not exists is_active boolean not null default true;
alter table public.rooms add column if not exists created_at timestamptz not null default now();

alter table public.room_members add column if not exists applicant_id uuid;
alter table public.room_members add column if not exists applicant_email text;
alter table public.room_members add column if not exists joined_at timestamptz not null default now();

alter table public.room_join_attempts add column if not exists applicant_id uuid;
alter table public.room_join_attempts add column if not exists attempted_code text;
alter table public.room_join_attempts add column if not exists was_success boolean not null default false;
alter table public.room_join_attempts add column if not exists attempted_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.room_members'::regclass
      and contype = 'f'
      and conkey = array[
        (
          select attnum
          from pg_attribute
          where attrelid = 'public.room_members'::regclass
            and attname = 'room_id'
            and not attisdropped
        )
      ]::smallint[]
  ) then
    alter table public.room_members
    add constraint room_members_room_id_fkey
    foreign key (room_id) references public.rooms(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rooms_join_code_key'
  ) then
    alter table public.rooms
    add constraint rooms_join_code_key unique (join_code);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'room_members_room_id_applicant_id_key'
  ) then
    alter table public.room_members
    add constraint room_members_room_id_applicant_id_key unique (room_id, applicant_id);
  end if;
end $$;

create index if not exists room_join_attempts_applicant_attempted_at_idx
on public.room_join_attempts (applicant_id, attempted_at desc);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_join_attempts enable row level security;

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
drop policy if exists "students_select_joined_rooms" on public.rooms;
create policy "students_select_joined_rooms"
on public.rooms
for select
to authenticated
using (
  exists (
    select 1
    from public.room_members
    where room_members.room_id = rooms.id
      and room_members.applicant_id = auth.uid()
  )
);

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

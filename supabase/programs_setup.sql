create extension if not exists pgcrypto;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.programs add column if not exists title text;
alter table public.programs add column if not exists is_active boolean not null default true;
alter table public.programs add column if not exists created_at timestamptz not null default now();
alter table public.programs add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'programs_title_key'
  ) then
    alter table public.programs
    add constraint programs_title_key unique (title);
  end if;
end $$;

insert into public.programs (title, is_active)
values
  ('Computer Systems Servicing NC II', true),
  ('Cookery NC II', true),
  ('Automotive Servicing NC I', true),
  ('Health Care Services NC II', true),
  ('Visual Graphic Design NC III', true)
on conflict (title) do update
set is_active = excluded.is_active;

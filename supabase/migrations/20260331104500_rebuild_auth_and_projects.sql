set check_function_bodies = off;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamp with time zone default timezone('utc', now());
alter table public.profiles add column if not exists updated_at timestamp with time zone default timezone('utc', now());

update public.profiles
set
  email = coalesce(email, ''),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, timezone('utc', now()));

alter table public.profiles alter column email set not null;
alter table public.profiles alter column created_at set default timezone('utc', now());
alter table public.profiles alter column updated_at set default timezone('utc', now());

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null default 'Untitled Project',
  description text,
  scene_data jsonb not null default '{}'::jsonb,
  thumbnail_url text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  last_opened_at timestamp with time zone,
  constraint projects_name_not_blank check (char_length(btrim(name)) > 0),
  constraint projects_scene_data_is_object check (jsonb_typeof(scene_data) = 'object')
);

alter table public.projects add column if not exists owner_id uuid references auth.users (id) on delete cascade;
alter table public.projects add column if not exists name text;
alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists scene_data jsonb default '{}'::jsonb;
alter table public.projects add column if not exists thumbnail_url text;
alter table public.projects add column if not exists created_at timestamp with time zone default timezone('utc', now());
alter table public.projects add column if not exists updated_at timestamp with time zone default timezone('utc', now());
alter table public.projects add column if not exists last_opened_at timestamp with time zone;

update public.projects
set
  name = coalesce(nullif(btrim(name), ''), 'Untitled Project'),
  scene_data = coalesce(scene_data, '{}'::jsonb),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, timezone('utc', now()));

alter table public.projects alter column owner_id set default auth.uid();
alter table public.projects alter column name set default 'Untitled Project';
alter table public.projects alter column scene_data set default '{}'::jsonb;
alter table public.projects alter column created_at set default timezone('utc', now());
alter table public.projects alter column updated_at set default timezone('utc', now());

create index if not exists projects_owner_id_updated_at_idx
on public.projects (owner_id, updated_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
drop trigger if exists update_projects_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.profiles (id, email, display_name, avatar_url)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'full_name', split_part(users.email, '@', 1)),
  users.raw_user_meta_data ->> 'avatar_url'
from auth.users as users
on conflict (id) do update
set
  email = excluded.email,
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
  display_name = coalesce(public.profiles.display_name, excluded.display_name),
  updated_at = timezone('utc', now());

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_own'
  ) then
    create policy "profiles_select_own"
    on public.profiles
    for select
    to authenticated
    using ((select auth.uid()) = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_insert_own'
  ) then
    create policy "profiles_insert_own"
    on public.profiles
    for insert
    to authenticated
    with check ((select auth.uid()) = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own"
    on public.profiles
    for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_select_own'
  ) then
    create policy "projects_select_own"
    on public.projects
    for select
    to authenticated
    using ((select auth.uid()) = owner_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_insert_own'
  ) then
    create policy "projects_insert_own"
    on public.projects
    for insert
    to authenticated
    with check ((select auth.uid()) = owner_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_update_own'
  ) then
    create policy "projects_update_own"
    on public.projects
    for update
    to authenticated
    using ((select auth.uid()) = owner_id)
    with check ((select auth.uid()) = owner_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_delete_own'
  ) then
    create policy "projects_delete_own"
    on public.projects
    for delete
    to authenticated
    using ((select auth.uid()) = owner_id);
  end if;
end
$$;

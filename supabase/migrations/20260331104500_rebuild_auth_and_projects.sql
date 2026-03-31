set check_function_bodies = off;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists projects_set_updated_at on public.projects;
drop trigger if exists update_projects_updated_at on public.projects;

drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();
drop function if exists public.update_updated_at_column() cascade;

drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table public.projects (
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

create index projects_owner_id_updated_at_idx on public.projects (owner_id, updated_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create function public.handle_new_user()
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

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "projects_select_own"
on public.projects
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "projects_insert_own"
on public.projects
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "projects_update_own"
on public.projects
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "projects_delete_own"
on public.projects
for delete
to authenticated
using ((select auth.uid()) = owner_id);

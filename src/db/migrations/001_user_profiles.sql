-- Migration: 001_user_profiles.sql
-- Description: Creates user_profiles table linked to auth.users

create table if not exists public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index on created_at for sorting/auditing
create index if not exists user_profiles_created_at_idx on public.user_profiles(created_at desc);

-- Function to handle updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
    before update on public.user_profiles
    for each row
    execute function public.handle_updated_at();

-- Trigger to automatically create profile on auth.user created
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.user_profiles (id, display_name, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

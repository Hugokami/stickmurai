-- Create public profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  status text not null default 'offline',
  peer_id text,
  last_seen timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  random_suffix text;
begin
  random_suffix := substring(md5(random()::text) from 1 for 4);
  insert into public.profiles (id, display_name, status)
  values (
    new.id,
    'Ronin-' || upper(random_suffix),
    'online'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create friendships table
create table public.friendships (
  user_id uuid references public.profiles(id) on delete cascade,
  friend_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'accepted',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, friend_id)
);

-- Enable RLS on friendships
alter table public.friendships enable row level security;

create policy "Users can view their own friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can create friendships"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete friendships"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Create invites table
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  sender_peer_id text not null,
  status text not null default 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on invites
alter table public.invites enable row level security;

create policy "Users can view invites they sent or received"
  on public.invites for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send invites"
  on public.invites for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "Users can update invite status"
  on public.invites for update
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Enable Supabase Realtime replication for profiles and invites
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.invites;

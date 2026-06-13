-- Add pvp_wins, pvp_losses, queue_mode to profiles
alter table public.profiles add column pvp_wins integer not null default 0;
alter table public.profiles add column pvp_losses integer not null default 0;
alter table public.profiles add column queue_mode text;

-- Alter friendships default status to pending
alter table public.friendships alter column status set default 'pending';

-- Add update policy for friendships so recipients can accept requests
create policy "Users can update friendships"
  on public.friendships for update
  to authenticated
  using (auth.uid() = friend_id or auth.uid() = user_id);

-- Enable Realtime replication for friendships table
alter publication supabase_realtime add table public.friendships;

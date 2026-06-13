-- Add short_id column to profiles
alter table public.profiles add column short_id integer;

-- Populate existing rows
update public.profiles set short_id = floor(random() * 90000000 + 10000000)::integer where short_id is null;

-- Make short_id not null and unique
alter table public.profiles alter column short_id set not null;
alter table public.profiles add constraint profiles_short_id_key unique (short_id);

-- Update trigger function to generate unique 8-digit short_id
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  random_suffix text;
  random_short_id integer;
  id_exists boolean;
begin
  random_suffix := substring(md5(random()::text) from 1 for 4);
  
  loop
    random_short_id := floor(random() * 90000000 + 10000000)::integer;
    select exists(select 1 from public.profiles where short_id = random_short_id) into id_exists;
    if not id_exists then
      exit;
    end if;
  end loop;

  insert into public.profiles (id, display_name, status, short_id)
  values (
    new.id,
    'Ronin-' || upper(random_suffix),
    'online',
    random_short_id
  );
  return new;
end;
$$;

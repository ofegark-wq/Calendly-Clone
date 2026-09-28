-- Phase 2: automatically create a profiles row whenever someone signs up.
--
-- auth.users is managed internally by Supabase Auth - we never insert
-- into it directly. This trigger reacts whenever a new row appears
-- there, copying the username the person entered at signup (passed as
-- "user metadata" to supabase.auth.signUp) into our own profiles table.
--
-- SECURITY DEFINER makes this function run with the permissions of
-- whoever owns it (not the person signing up), so it can write to
-- profiles even though the signed-up user has no session yet at this
-- exact moment. Setting search_path explicitly is a standard hardening
-- step for this kind of function, so it can't be tricked into resolving
-- "public" to some other schema.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

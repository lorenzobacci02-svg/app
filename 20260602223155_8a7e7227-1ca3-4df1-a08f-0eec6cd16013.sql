create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, name)
  values (new.id, coalesce(new.email, ''), '')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
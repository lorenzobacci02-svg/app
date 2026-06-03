
-- PROFILES
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  monthly_salary numeric not null default 0,
  fixed_costs numeric not null default 0,
  savings_goal text not null default '',
  risk_tolerance text not null default '',
  completed boolean not null default false,
  trial_started_at timestamptz not null default now(),
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = user_id);
create policy "own profile delete" on public.profiles for delete to authenticated using (auth.uid() = user_id);

-- Trigger: auto create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (user_id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- EXPENSES
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  category text not null,
  frequency text not null,
  due_date timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);
create index expenses_user_id_idx on public.expenses(user_id);

grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
alter table public.expenses enable row level security;

create policy "own expenses select" on public.expenses for select to authenticated using (auth.uid() = user_id);
create policy "own expenses insert" on public.expenses for insert to authenticated with check (auth.uid() = user_id);
create policy "own expenses update" on public.expenses for update to authenticated using (auth.uid() = user_id);
create policy "own expenses delete" on public.expenses for delete to authenticated using (auth.uid() = user_id);

-- DEBTS / CREDITS
create table public.debts_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('debt','credit')),
  counterparty text not null,
  amount numeric not null,
  due_date timestamptz,
  note text,
  settled boolean not null default false,
  created_at timestamptz not null default now()
);
create index debts_credits_user_id_idx on public.debts_credits(user_id);

grant select, insert, update, delete on public.debts_credits to authenticated;
grant all on public.debts_credits to service_role;
alter table public.debts_credits enable row level security;

create policy "own dc select" on public.debts_credits for select to authenticated using (auth.uid() = user_id);
create policy "own dc insert" on public.debts_credits for insert to authenticated with check (auth.uid() = user_id);
create policy "own dc update" on public.debts_credits for update to authenticated using (auth.uid() = user_id);
create policy "own dc delete" on public.debts_credits for delete to authenticated using (auth.uid() = user_id);

-- updated_at trigger for profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- Caderno de Estudos: rodar uma vez no SQL Editor do Supabase (projeto da ÔDO).
-- Uma linha por pessoa com todo o estado do caderno. Só a dona da linha lê e escreve.

create table if not exists public.estudo_estado (
  owner uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado timestamptz not null default now()
);

alter table public.estudo_estado enable row level security;

drop policy if exists "estudo_estado_dona_le" on public.estudo_estado;
drop policy if exists "estudo_estado_dona_cria" on public.estudo_estado;
drop policy if exists "estudo_estado_dona_altera" on public.estudo_estado;

create policy "estudo_estado_dona_le" on public.estudo_estado
  for select to authenticated using (auth.uid() = owner);
create policy "estudo_estado_dona_cria" on public.estudo_estado
  for insert to authenticated with check (auth.uid() = owner);
create policy "estudo_estado_dona_altera" on public.estudo_estado
  for update to authenticated using (auth.uid() = owner) with check (auth.uid() = owner);

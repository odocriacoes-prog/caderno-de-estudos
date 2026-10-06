-- Caderno de Estudos: rodar uma vez no SQL Editor do Supabase (projeto da ÔDO).
-- O caderno abre sem login. Todo o estado fica numa linha fixa (id = 'lidi').
-- Quem tiver o endereço do site consegue ler e editar essa linha, e só ela:
-- as outras tabelas do projeto não são afetadas.

create table if not exists public.estudo_aberto (
  id text primary key,
  dados jsonb not null default '{}'::jsonb,
  atualizado timestamptz not null default now()
);

alter table public.estudo_aberto enable row level security;

drop policy if exists "caderno_le" on public.estudo_aberto;
drop policy if exists "caderno_cria" on public.estudo_aberto;
drop policy if exists "caderno_altera" on public.estudo_aberto;

create policy "caderno_le" on public.estudo_aberto
  for select to anon, authenticated using (id = 'lidi');
create policy "caderno_cria" on public.estudo_aberto
  for insert to anon, authenticated with check (id = 'lidi');
create policy "caderno_altera" on public.estudo_aberto
  for update to anon, authenticated using (id = 'lidi') with check (id = 'lidi');

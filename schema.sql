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

-- Temas em alta (Meu Perfil). Tabela separada para o Claude inserir pautas
-- sem sobrescrever o estado do caderno. Aberta como o resto do caderno.
create table if not exists public.caderno_temas (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  data date not null default current_date,
  titulo text not null,
  porque text, fonte_nome text, fonte_url text, angulo text, headline text, pilar text, editoria text,
  formato text not null default 'carrossel' check (formato in ('carrossel','reels','qualquer')),
  janela text check (janela in ('hoje','semana','mes')),
  status text not null default 'novo' check (status in ('novo','guardado','usado','descartado')),
  origem text not null default 'claude' check (origem in ('claude','manual'))
);
alter table public.caderno_temas enable row level security;
create policy "temas_le" on public.caderno_temas for select to anon, authenticated using (true);
create policy "temas_cria" on public.caderno_temas for insert to anon, authenticated with check (true);
create policy "temas_altera" on public.caderno_temas for update to anon, authenticated using (true) with check (true);
create policy "temas_apaga" on public.caderno_temas for delete to anon, authenticated using (true);

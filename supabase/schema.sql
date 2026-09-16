-- Rode este script inteiro no SQL Editor do seu projeto Supabase
-- (Supabase Dashboard > SQL Editor > New query > colar e rodar)

create extension if not exists "pgcrypto";

-- Categorias (projetos, empresas, instituições de ensino, prêmios, etc.)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color_key text not null default 'cyan', -- cyan | coral | amber | teal | pink | purple
  created_at timestamptz not null default now()
);

-- Cada "nó" do diário de bordo
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  category_id uuid references categories(id) on delete set null,
  image_url text,
  content text, -- corpo do texto / descrição detalhada (markdown simples)
  skills text[] default '{}', -- tags de habilidades
  external_url text, -- link opcional (repo, site da empresa, etc.)
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Conexões entre cards (com ou sem seta, definidas livremente pelo admin)
create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references cards(id) on delete cascade,
  target_id uuid not null references cards(id) on delete cascade,
  directed boolean not null default false, -- true = desenha seta de source -> target
  created_at timestamptz not null default now(),
  constraint no_self_link check (source_id <> target_id)
);

-- Índices úteis
create index if not exists idx_cards_category on cards(category_id);
create index if not exists idx_connections_source on connections(source_id);
create index if not exists idx_connections_target on connections(target_id);

-- Row Level Security: leitura pública, escrita só autenticado (você, via login admin)
alter table categories enable row level security;
alter table cards enable row level security;
alter table connections enable row level security;

create policy "categorias visíveis para todos" on categories for select using (true);
create policy "cards visíveis para todos" on cards for select using (true);
create policy "conexões visíveis para todas" on connections for select using (true);

create policy "admin gerencia categorias" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin gerencia cards" on cards for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin gerencia conexões" on connections for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Categorias iniciais de exemplo — edite/apague como quiser pela área de admin depois
insert into categories (name, color_key) values
  ('Projetos', 'cyan'),
  ('Empresas', 'coral'),
  ('Instituições de ensino', 'amber'),
  ('Prêmios', 'pink')
on conflict (name) do nothing;

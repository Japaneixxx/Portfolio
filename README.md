# Portfólio — Diário de Bordo

Site de portfólio pessoal com navegação estilo "Ship Log" de Outer Wilds: cards
coloridos por categoria (projetos, empresas, instituições de ensino, prêmios),
conectados por linhas configuráveis, com uma área de admin pra editar tudo.

## Stack

- **Frontend:** React + Vite, hospedado na Vercel (deploy automático a cada push)
- **Dados/Auth:** Supabase (Postgres + autenticação por e-mail/senha)
- Sem servidor próprio pra manter no ar — só essas duas peças gerenciadas.

## Passo a passo pra rodar

### 1. Criar o projeto no Supabase

1. Crie uma conta em https://supabase.com e um novo projeto (é grátis).
2. No painel do projeto, vá em **SQL Editor** → **New query**, cole todo o
   conteúdo de `supabase/schema.sql` e rode. Isso cria as tabelas
   (`categories`, `cards`, `connections`) e já insere 4 categorias de exemplo.
3. Vá em **Authentication → Users → Add user** e crie o seu usuário admin
   (e-mail + senha). É esse login que você vai usar em `/admin`.
4. Vá em **Project Settings → API** e copie:
   - `Project URL` → vira `VITE_SUPABASE_URL`
   - `anon public key` → vira `VITE_SUPABASE_ANON_KEY`

### 2. Rodar localmente

```bash
npm install
cp .env.example .env
# edite o .env com os valores copiados do Supabase
npm run dev
```

Acesse `http://localhost:5173` pro site e `http://localhost:5173/admin` pra
área de admin (login com o usuário criado no passo 3 acima).

### 3. Colocar conteúdo

Pela área de admin você pode:

- **Categorias**: criar/apagar categorias e escolher a cor de cada uma
  (a faixa de título dos cards usa essa cor).
- **Cards**: criar/editar/apagar cada "nó" do diário de bordo (título,
  imagem, texto, habilidades, link externo).
- **Importar do LinkedIn**: na aba Cards, selecione um CSV ou ZIP da opção
  "Baixar seus dados" do LinkedIn. O arquivo é processado localmente, mostra
  uma prévia e só cria ou atualiza os cards depois da confirmação. Títulos
  já importados sem mudanças são ignorados; alterações atualizam o card sem
  mexer na posição, imagem ou habilidades.
  Também é possível selecionar o PDF do perfil como alternativa; por ser um
  formato visual, a extração é aproximada e a prévia deve ser revisada.
- **Conexões**: ligar dois cards, escolhendo se a linha tem seta ou não.
  Um card sem nenhuma conexão fica sozinho — não precisa ligar tudo.
- **Layout**: arrastar os cards pra reposicionar; a posição é salva na hora
  e vale pra todo mundo que visitar o site. Ative "Linkar cards" para clicar
  no card de origem e depois no destino, com opção de criar a conexão com seta.

### 4. Deploy na Vercel

1. Suba este projeto pra um repositório no GitHub.
2. Em https://vercel.com, importe o repositório.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` com os mesmos valores do seu `.env`.
4. Deploy. A partir daí, todo `git push` gera um novo deploy automático.

## Estrutura

```
src/
  lib/            cliente Supabase, contexto de auth, paleta de cores
  components/     Navbar, CardNode (o card do diário), ConnectionsLayer (linhas SVG)
  pages/          ShipLog (home), CardDetail, About, Contact, AdminLogin, AdminDashboard
  pages/admin/    CardsManager, CategoriesManager, ConnectionsManager, LayoutEditor
supabase/
  schema.sql      script único pra criar as tabelas e políticas de acesso
```

## O que ainda falta (próximos passos combinados)

- Ajuste fino de tipografia/paleta pra bater 100% com o Figma.
- Zoom no diário de bordo (hoje só existe pan/arraste).

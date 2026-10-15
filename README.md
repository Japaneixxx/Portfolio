# Portifolio pessoal

Este é o portfólio pessoal do Japa. O repositório é público para mostrar como
o projeto foi pensado e construído. Ele não é um template, produto genérico ou
aplicação pronta para outra pessoa simplesmente compilar e usar como está.

O código pode ser estudado e trechos podem ser aproveitados em outros
projetos. Textos, imagens, identidade visual e dados deste portfólio são
específicos do Japa e não devem ser tratados como conteúdo reutilizável.

O site apresenta projetos, empresas, instituições de ensino e prêmios como
cards coloridos conectados por linhas configuráveis, com uma área privada de
administração para editar o conteúdo e o layout.

## Objetivo do projeto

O projeto existe para publicar e manter o portfólio pessoal com o mínimo de
infraestrutura própria. A manutenção acontece pelo painel admin e o deploy é
feito na Vercel. A documentação serve para explicar este projeto e facilitar
o estudo do código; não há compromisso de compatibilidade ou suporte para
instalações derivadas.

## Stack

- **Frontend:** React + Vite, hospedado na Vercel
- **Dados/Auth:** Supabase (Postgres + autenticação por e-mail/senha)
- Sem servidor próprio pra manter no ar — só essas duas peças gerenciadas.

## Passo a passo pra rodar

### 1. Configurar o projeto no Supabase

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

Na Vercel, a rota `/admin` também funciona diretamente graças ao rewrite
configurado em `vercel.json`. O link Admin aparece no menu, mas o dashboard
continua protegido pelo login do Supabase.

### 3. Colocar conteúdo

Pela área de admin você pode:

- **Categorias**: criar/apagar categorias e escolher a cor de cada uma
  (a faixa de título dos cards usa essa cor).
- **Cards**: criar/editar/apagar cada "nó" do Portifolio (título,
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

1. Suba este projeto para um repositório privado no GitHub.
2. Em https://vercel.com, importe o repositório.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` com os mesmos valores do seu `.env`.
4. Faça o deploy. A partir daí, cada `git push` gera um novo deploy automático.

### 5. Gerar o fallback offline

Com o banco e as imagens funcionando, entre em `/admin` e clique em
**Exportar fallback**. O navegador baixa um ZIP com `fallback-data.json`, a
pasta `images/` e um `README.txt` com as instruções.

Extraia `fallback-data.json` para `public/fallback-data.json` e `images/` para
`public/images/`. Publique novamente o projeto. Quando o Supabase cair, o site
tentará usar os dados do cache do navegador e, depois, esse fallback incluído
no deploy. Imagens externas que não puderem ser baixadas durante a exportação
continuarão dependendo da URL original.

## Estrutura

```
src/
  lib/            cliente Supabase, contexto de auth, paleta de cores
  components/     Navbar, CardNode, CachedImage, ConnectionsLayer, ZoomControls
  pages/          ShipLog (home), CardDetail, About, Contact, AdminLogin, AdminDashboard
  pages/admin/    CardsManager, CategoriesManager, ConnectionsManager, LayoutEditor
  lib/            cliente Supabase, autenticação, pan/zoom, cache e exportação de fallback
supabase/
  schema.sql      script único pra criar as tabelas e políticas de acesso
```

## Estado atual

- Conteúdo e layout são administrados pelo painel privado.
- O fallback de dados usa cache local e pode ser empacotado no deploy.
- Imagens carregadas são mantidas no Cache Storage do navegador para uso offline.
- O pacote de fallback deve ser regenerado após mudanças relevantes no conteúdo.

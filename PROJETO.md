# PROJETO.md — Portifolio pessoal

Este arquivo existe para registrar as decisões e o estado do portfólio para
manutenção futura. Leia isto antes de mexer no código.

Este é um projeto pessoal em repositório público, mantido como referência do
processo de construção do portfólio. Não tratar o código como um template ou
como uma aplicação pronta para terceiros simplesmente compilarem e usarem.

Trechos de código podem ser estudados e reaproveitados em outros projetos.
Textos, imagens, identidade visual e dados são específicos do portfólio e não
fazem parte desse reaproveitamento.

## O que é

Site de portfólio pessoal ("Japa") inspirado no Ship Log
de Outer Wilds: cards representando projetos, empresas, instituições de
ensino e prêmios, espalhados por um canvas navegável (arrastar + zoom),
conectados por linhas configuráveis (com ou sem seta). Uma área de admin
permite editar tudo isso, incluindo reposicionar os cards pra todo mundo
que visita o site.

## Decisões já tomadas (não reabrir sem necessidade)

- **Stack:** React + Vite no frontend, hospedado na **Vercel**. Dados e
  autenticação no **Supabase** (Postgres + Auth por e-mail/senha). Não usar
  Java nem backend próprio — objetivo explícito é o mínimo de manutenção
  possível, sem servidor pra manter no ar.
- **Sem serverless functions próprias:** as escritas (admin) vão direto do
  navegador pro Supabase, protegidas por Row Level Security (RLS) — quem
  não está autenticado só consegue ler, nunca escrever. Ver
  `supabase/schema.sql`.
- **Referência de navegação:** especificamente o Ship Log de Outer Wilds
  (não o mapa orbital do sistema solar do jogo) — nós fixos, linhas
  conectando registros relacionados, cor por categoria.
- **Layout dos cards é fixo pra quem visita**; só o admin reposiciona, e
  essa posição vale globalmente (não é por visitante).
- **A área navegável começa centralizada** nos modos visitante e admin,
  e fica contida na viewport com overflow recortado. O grid de referência
  é infinito, acompanha pan e zoom, e os eixos horizontal e vertical mais
  espessos acompanham o ponto central do canvas.
- **Cards novos começam centralizados** no canvas; cards já posicionados
  manualmente mantêm suas coordenadas salvas.
- **Conexões são livres:** o admin escolhe manualmente quais cards se
  ligam, se a linha tem seta (direcional) ou não, e pode deixar um card
  sem nenhuma conexão. Além da aba Conexões, o admin pode ativar o modo
  "Linkar cards" no editor de Layout e clicar na origem e no destino.
- **Login do admin é simples** (e-mail/senha via Supabase Auth) — sem
  OAuth, sem 2FA por enquanto.
- **Importação do LinkedIn:** o LinkedIn não tem API pública pra isso e
  scraping viola os termos de uso dele. O caminho combinado é: o usuário
  exporta os próprios dados do LinkedIn (Configurações → "Baixar seus
  dados") e o importador na aba de Cards lê CSV ou ZIP localmente, mostra
  uma prévia e grava os cards somente após confirmação. O importador compara
  títulos normalizados: ignora registros iguais e atualiza o card existente
  quando os dados importados mudam, preservando posição, imagem e habilidades.
  O PDF do perfil também é aceito como alternativa, mas sua extração é
  aproximada e sempre requer revisão da prévia.
- **Resiliência do conteúdo público:** a home e os detalhes usam a última
  leitura válida salva no navegador quando o Supabase fica indisponível.
  Também podem usar um `public/fallback-data.json` acompanhado da pasta
  `public/images/`, gerados pelo botão **Exportar fallback** no admin.
- **Backup operacional:** depois de alterações importantes, o admin deve
  gerar novamente o ZIP de fallback e atualizar os arquivos estáticos do
  deploy. O fallback não substitui o banco; ele é uma cópia de emergência.

## Estrutura de pastas

```
src/
  lib/
    supabaseClient.js   cliente único do Supabase (usa variáveis de ambiente)
    AuthContext.jsx      contexto React com a sessão de auth do admin
    usePanZoom.js         hook de arrastar+zoom, reusado no ShipLog e no LayoutEditor
    palette.js            mapa color_key -> hex (cyan, coral, amber, pink, purple, teal)
    publicDataCache.js    cache local e leitura do fallback estático
    exportFallback.js     exportação do backup em ZIP pelo admin
  components/
    Navbar.jsx
    CardNode.jsx          o card individual (faixa de título colorida + imagem)
    ConnectionsLayer.jsx   camada SVG com as linhas entre cards
    ZoomControls.jsx       botões +/-/reset de zoom
    CachedImage.jsx         cache local e fallback para imagens
  pages/
    ShipLog.jsx            home: canvas navegável com todos os cards
    CardDetail.jsx          página de detalhe de um card (/card/:id)
    About.jsx, Contact.jsx  páginas estáticas simples (editar texto direto no arquivo)
    AdminLogin.jsx          formulário de login
    AdminDashboard.jsx      shell do admin com abas
    admin/
      LayoutEditor.jsx       aba "Layout": arrastar cards, salvar posição
      CardsManager.jsx       aba "Cards": CRUD de cards
      CategoriesManager.jsx  aba "Categorias": CRUD de categorias
      ConnectionsManager.jsx aba "Conexões": criar/remover ligações entre cards
supabase/
  schema.sql   script único: cria tabelas, RLS, categorias iniciais de exemplo
```

## Modelo de dados (Supabase / Postgres)

- **categories**: `id, name, color_key, created_at`
- **cards**: `id, title, subtitle, category_id, image_url, content, skills[], external_url, position_x, position_y, created_at, updated_at`
- **connections**: `id, source_id, target_id, directed (bool), created_at`

RLS: leitura (`select`) liberada pra qualquer um (`using (true)`); escrita
(`insert/update/delete`) só pra `auth.role() = 'authenticated'`.

## Como rodar (resumo — detalhes completos no README.md)

```bash
npm install
cp .env.example .env   # preencher com URL/anon key do seu projeto Supabase
npm run dev
```

Rodar `supabase/schema.sql` no SQL Editor do Supabase antes de tudo, e
criar um usuário em Authentication → Users pra logar em `/admin`.

## Estado atual e próximos passos

1. **Ajuste fino visual** para bater 100% com o Figma do usuário (link:
   `https://www.figma.com/design/ROt2Pgy4WK0bcXuqBdflZf/Portifolio` — não
   é acessível por fetch automático, precisa de prints ou descrição
   manual do usuário). Cores atuais são uma aproximação (paleta em
   `src/lib/palette.js`), fonte de título usa Space Grotesk como
   aproximação da fonte retrô do Ship Log.
2. **Deploy na Vercel** ainda precisa ser configurado quando o conteúdo
  estiver pronto.
3. **Fallback estático:** gerar o ZIP pelo admin e copiar seu conteúdo para
  `public/fallback-data.json` e `public/images/` antes do deploy.

## Convenções de estilo do código

- Componentes funcionais, sem TypeScript (JS puro + JSX).
- CSS puro em `src/styles.css`, sem framework de CSS. Variáveis de tema em
  `:root` (`--bg`, `--panel`, `--border`, `--text`, `--accent`, etc.).
- Cor de cada card vem da categoria (`palette.js`), nunca hardcoded no
  componente.
- Toda escrita no Supabase é feita direto dos componentes de admin via
  `supabase.from(...).insert/update/delete` — não há camada de API própria.

# NoStock

Sistema de gestão de estoque para a **Bioma Pet Shop** (Joinville/SC).
Projeto extensionista do curso de Engenharia de Software, Centro Universitário Católica de Santa Catarina.

**Equipe:** Anttonio Osório Molinaro Maccagnini · Gabriel Lengert Guedes · Heitor Lopes Reis · João Pedro Alves de Lima · João Vitor Paranhos · Rafael Alexandre Alves Bandoch

---

## O sistema

Aplicação web para substituir o controle de estoque em planilhas e cadernos: cadastro de produtos, registro de entradas e saídas com responsável e horário, alerta de itens abaixo do mínimo, dashboard, relatórios e sugestão de compra por fornecedor.

- **Front-end:** React + Vite (SPA)
- **Back-end:** Node.js 22 + Express (API REST)
- **Banco:** PostgreSQL (Supabase)

---

## Como rodar na sua máquina

São quatro passos e levam cerca de cinco minutos. Você **não** precisa instalar banco de dados,
nem Docker: o banco já existe, na nuvem, e é o mesmo para a equipe inteira.

### Antes de começar

| O que | Como conferir | Onde pegar |
|---|---|---|
| **Node.js 22 ou superior** | `node -v` mostra `v22` ou maior | [nodejs.org](https://nodejs.org) — baixe a versão LTS |
| **Git** | `git --version` responde | [git-scm.com](https://git-scm.com) |
| **A `DATABASE_URL` do projeto** | — | No cofre da equipe. Peça a quem cuida da infraestrutura |

> A `DATABASE_URL` é uma senha e não pode ser publicada em lugar nenhum.

### 1. Baixe o projeto

```bash
git clone https://github.com/GabrielLengertGuedes/NoStock.git
cd NoStock
```

### 2. Instale as dependências

```bash
npm install
```

Roda uma vez só. Depois disso, só quando alguém adicionar uma biblioteca nova.

### 3. Crie o seu arquivo `.env`

O repositório traz um `.env.example` com todas as variáveis e um comentário explicando cada uma.
Copie e edite o **seu** `.env` — ele fica só na sua máquina e nunca é enviado para o GitHub.

```bash
cp .env.example .env      # Windows (PowerShell): copy .env.example .env
```

Abra o `.env` no editor e preencha as duas obrigatórias:

- **`DATABASE_URL`** — cole exatamente a string que você pegou no cofre.
- **`SESSION_SECRET`** — qualquer sequência aleatória longa, inventada por você.
  Não precisa combinar com a de ninguém.

As outras já vêm preenchidas com o valor certo para desenvolvimento. Não mexa nelas.

> **Seu `.env` é antigo e tem `NODE_ENV=development`? Apague essa linha.** O Vite também lê o
> `.env`, e com ela o `npm run build` sai com o React de desenvolvimento, bem maior e mais lento.
> A API já assume desenvolvimento quando a variável não existe.

### 4. Suba o projeto

```bash
npm run dev
```

Sobem duas coisas ao mesmo tempo, em painéis coloridos no terminal:

- **`web`** — o site, em <http://localhost:5173>
- **`api`** — a API, em <http://localhost:3001>

Abra o endereço do `web` no navegador. Para parar tudo, `Ctrl+C` no terminal.

---

## Comandos

| Comando | O que faz |
|---|---|
| `npm install` | Instala tudo |
| `npm run dev` | Sobe a API e o site juntos |
| `npm test` | Roda os testes |
| `npm run backup` | Gera uma cópia do banco em `db/backups/` |
| `npm run lint` | Aponta erros de padrão no código |

Se precisar subir só um lado, existem `npm run dev:api` e `npm run dev:web`.

### Testes E2E no navegador

Os E2E usam Playwright, a interface compilada e a API real. O comando inicia um
**PostgreSQL 17 exclusivo e temporário**, aplica o schema e todas as migrações,
cria usuários e produtos fictícios e remove a instância ao terminar. Não usa a
`DATABASE_URL` do `.env`, não acessa o Supabase e não precisa de Docker ou de
PostgreSQL instalado no sistema. Os binários do banco vêm na dependência de
desenvolvimento `embedded-postgres`; execute com seu usuário normal, não como root.

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

No Linux, se faltarem bibliotecas do navegador, use
`npx playwright install --with-deps chromium`. A instalação dessas bibliotecas
pode precisar de permissão de administrador.

```bash
npm run test:e2e -- --project=desktop
npm run test:e2e -- --project=celular
npm run test:e2e -- tests/e2e/movimentacoes.spec.js
npm run test:e2e:ui
npx playwright show-report
```

A API dos testes usa a porta **3002** e a interface, **4175**. As portas precisam
estar livres: o runner não reaproveita servidores de desenvolvimento. A porta
do PostgreSQL é escolhida automaticamente. Cada teste restaura dados fictícios
e recebe um contexto de navegador novo; a execução usa um worker para evitar
disputa pela restauração da base.

O relatório HTML fica em `playwright-report/`, com screenshots de falhas em
`test-results/`. No CI, a primeira repetição de uma falha também grava um trace;
é possível solicitar traces localmente com `npm run test:e2e -- --trace on`.
Esses diretórios, o build em `.cache/e2e-dist/` e dados de execução não entram no Git.

A suíte cobre acesso, permissões, catálogo, cadastros, usuários, movimentações,
histórico, reposição, relatórios e fluxos da versão móvel. Os testes não enviam
push nem contatam fornecedores. O perfil celular emula Chromium em 390 × 844;
não substitui conferir instalação PWA e notificações em um aparelho real.

Os helpers de banco ficam em `scripts/e2e/`: aceitam somente a base local
`nostock_e2e` e exigem sua marca de identificação para restaurar dados. O runner
gera a conexão e senhas efêmeras em memória; não é necessário criar outro `.env`.
O workflow de Pull Request executa os E2E em um job independente e disponibiliza
o relatório por 7 dias.

### Testes normais com banco isolado

Todos os comandos do Vitest usam um **PostgreSQL 17 temporário**, criado pelo
`tests/globalSetup.js`, com porta e senha geradas por execução. Isso vale para
`npm test`, `npm run test:unit`, `npm run test:watch` e `npx vitest run ...`.
Não é necessário PostgreSQL instalado no sistema, Docker ou outro `.env`.

O setup aplica bootstrap, schema, migrações em ordem e seed de categorias. Antes
de carregar cada arquivo de teste, substitui a configuração de banco e sessão
pela configuração temporária e desliga push. A `DATABASE_URL` de desenvolvimento
é ignorada, mesmo que esteja definida no terminal ou no `.env`. Sem o contexto
do banco temporário, a execução falha antes de carregar os testes.

O banco usa locale UTF-8 para tratar corretamente maiúsculas e acentos e é
removido ao terminar, inclusive no modo watch ao encerrar o Vitest. A execução
no CI usa esse mesmo fluxo, sem um serviço PostgreSQL adicional.

Durante o desenvolvimento, escolha o recorte necessário:

- Suíte normal completa: `npm test`.
- Só unitários: `npm run test:unit`.
- Um módulo: `npx vitest run tests/integration/categorias.test.js`.
- Reexecução ao salvar: `npm run test:watch`.

Os unitários não fazem consultas ao banco, mas a execução também prepara o
ambiente isolado. O tempo depende da máquina, sem as viagens de rede ao Supabase.

**A preparação e a remoção automáticas se limitam aos bancos temporários dos
testes.** O banco de desenvolvimento continua compartilhado e não é alterado
por esses comandos. Mudança na estrutura do sistema entra como arquivo novo em
`db/migrations/`, aplicado à mão e avisado no grupo.

> **Mexeu na estrutura do banco? A mudança tem que virar migração versionada.**
> O CI reconstrói um banco do zero a cada Pull Request, aplicando `db/schema.sql` e depois cada
> arquivo de `db/migrations/`. Se você alterar o Supabase pelo SQL editor e não deixar a
> migração na mesma PR, o banco do CI fica com a estrutura antiga: os testes passam contra um
> banco que não existe mais. Detalhes em [`db/migrations/README.md`](db/migrations/README.md).

---

## Versão para celular e alertas push

A versão para celular fica em `/m`: Início, Estoque, Produto, Histórico, Repor (só gestor) e
Conta. É um PWA: no celular, o navegador oferece instalar, e o ícone abre direto em `/m`.
Cadastros, usuários e relatórios continuam só na versão completa.

Os alertas avisam quando uma saída piora o status de um produto (abaixo do mínimo, crítico ou
sem estoque). Eles só funcionam com as três variáveis `VAPID_*` no `.env`. Sem elas, a API sobe
normalmente e só os alertas ficam desligados:

```bash
npx web-push generate-vapid-keys
```

Cole a chave pública em `VAPID_PUBLIC_KEY`, a privada em `VAPID_PRIVATE_KEY`, e um contato em
`VAPID_SUBJECT` (`mailto:alguem@dominio`). A privada é segredo, como a `DATABASE_URL`.

- **Para testar no computador**, o `localhost` basta: abra `http://localhost:5173/m`, vá em Conta
  e ative os alertas.
- **Para testar no celular**, é preciso HTTPS. Use o endereço publicado ou um túnel HTTPS para a
  porta 5173; pelo IP da rede local o navegador não libera o push.
- **No iPhone**, o alerta só chega com o app adicionado à Tela de Início (iOS 16.4 ou mais novo).
- **Os testes nunca mandam alerta de verdade**: usam bancos temporários exclusivos
  e chaves VAPID vazias, sem inscrições de celulares da equipe.

---

## Quando algo dá errado

### `node: command not found`, ou `node -v` mostra uma versão menor que 22

O Node não está instalado, ou está desatualizado. Instale a versão LTS pelo
[nodejs.org](https://nodejs.org), **feche e abra o terminal** e confira de novo com `node -v`.
Fechar o terminal é o passo que a maioria esquece.

### `cp: command not found` no Windows

O `cp` é comando de Mac e Linux. No PowerShell use `copy .env.example .env`, ou copie e cole o
arquivo pelo Explorador de Arquivos mesmo, renomeando a cópia para `.env`.

### O `.env` não aparece na pasta

Arquivos que começam com ponto ficam escondidos. No Windows, marque **Itens ocultos** na aba
Exibir; no Mac, `Cmd + Shift + .` no Finder. Pelo editor de código ele aparece normalmente.

### A API sobe e cai avisando que falta uma variável

É a mensagem funcionando como deveria: a API se recusa a subir pela metade. Ela diz o nome da
variável que faltou — abra o `.env` e preencha. O erro mais comum é o `SESSION_SECRET` em
branco, porque o `.env.example` vem sem valor de propósito.

### Erro de conexão com o banco

Quase sempre é a `DATABASE_URL` colada errado. Confira:

- se veio inteira, sem espaço nem quebra de linha no meio;
- se não sobrou aspas nas pontas;
- se a senha tem `@`, `#` ou `/`, esses caracteres precisam vir codificados na string — peça a
  versão já pronta a quem cuida da infraestrutura em vez de montar na mão.

Se ainda assim não conecta, teste a sua internet e confirme no grupo se o banco está no ar.

### `Port 5173 is already in use` (ou 3001)

Já tem uma cópia do projeto rodando em outro terminal. Feche-a com `Ctrl+C`. Se não achar,
feche todos os terminais e comece de novo.

### `pg_dump não encontrado` no `npm run backup`

O backup usa uma ferramenta que vem junto com o PostgreSQL. Instale o
[cliente do PostgreSQL](https://www.postgresql.org/download/) e tente de novo. Só quem cuida do
backup precisa disso — para desenvolver, não é necessário.

### Nada disso resolveu

Apague a pasta de dependências e reinstale:

```bash
rm -rf node_modules        # Windows (PowerShell): Remove-Item -Recurse -Force node_modules
npm install
```

Se continuar, mande no grupo **a mensagem de erro inteira**, copiada do terminal. Print cortado
no "erro" não diz nada; a linha útil costuma estar três linhas abaixo.

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

### Não rode a suíte inteira o tempo todo

`npm test` leva de **1 a 3 minutos**, e quase tudo é espera de rede. A suíte dispara 2.471
consultas, e o banco gasta **1,6 s** executando todas elas — o resto do tempo é o pacote indo e
voltando até a nuvem. Por isso varia tanto com a sua conexão: medimos a mesma suíte em 49 s, 78 s
e 75 s na mesma máquina. Não é problema de ter teste demais; é a distância até o Supabase.
Enquanto você programa, rode só o que interessa:

| Quando | Comando | Leva |
|---|---|---|
| Mexendo em regra pura, componente, schema | `npm run test:unit` | **~1 s** (nem toca no banco) |
| Mexendo em um módulo | `npx vitest run tests/integration/categorias.test.js` | **~13 s** |
| Deixar rodando enquanto edita | `npm run test:watch` | Reexecuta sozinho ao salvar |
| Antes de abrir a PR | `npm test` | 1–3 min |

A suíte inteira é responsabilidade da CI, que roda a cada PR sem consumir o seu tempo. Rodar
tudo a cada `Ctrl+S` é o que faz o teste parecer caro.

**Não existe comando que crie, apague ou recarregue o banco — de propósito.** O banco é um só e
é compartilhado: um comando desses apagaria o trabalho de cinco pessoas. Mudança na estrutura do
banco entra como arquivo novo em `db/migrations/`, aplicado à mão e avisado no grupo.

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
- **Os testes nunca mandam alerta de verdade**: o `tests/setup.js` apaga as chaves VAPID, porque o
  banco de desenvolvimento é compartilhado e pode ter celulares da equipe inscritos.

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

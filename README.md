# NoStock

Sistema de gestão de estoque para a **Bioma Pet Shop** (Joinville/SC).
Projeto extensionista do curso de Engenharia de Software, Centro Universitário Católica de Santa Catarina.

**Equipe:** Anttonio Osório Molinaro Maccagnini · Gabriel Lengert Guedes · Heitor Lopes Reis · João Pedro Alves de Lima · João Vitor Paranhos · Rafael Alexandre Alves Bandoch

---

## O sistema

Aplicação web para substituir o controle de estoque em planilhas e cadernos: cadastro de produtos, registro de entradas e saídas com responsável e horário, alerta de itens abaixo do mínimo, dashboard, relatórios e sugestão de compra por fornecedor.

- **Front-end:** React + Vite (SPA)
- **Back-end:** Node.js 20 + Express (API REST)
- **Banco:** PostgreSQL (Supabase)

---

## Como rodar na sua máquina

São quatro passos e levam cerca de cinco minutos. Você **não** precisa instalar banco de dados,
nem Docker: o banco já existe, na nuvem, e é o mesmo para a equipe inteira.

### Antes de começar

| O que | Como conferir | Onde pegar |
|---|---|---|
| **Node.js 20 ou superior** | `node -v` mostra `v20` ou maior | [nodejs.org](https://nodejs.org) — baixe a versão LTS |
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

`npm test` leva de **1 a 3 minutos**, e quase tudo é espera de rede: o banco está na nuvem, cada
ida e volta custa uns 120 ms, e o tempo varia bastante com a sua conexão — medimos 49 s, 55 s e
75 s na mesma máquina, na mesma tarde. Não é problema de ter teste demais; é a distância até o
Supabase. Enquanto você programa, rode só o que interessa:

| Quando | Comando | Leva |
|---|---|---|
| Mexendo em regra pura, componente, schema | `npm run test:unit` | **~1 s** (39 testes, nem toca no banco) |
| Mexendo em um módulo | `npx vitest run tests/integration/categorias.test.js` | **~13 s** |
| Deixar rodando enquanto edita | `npm run test:watch` | Reexecuta sozinho ao salvar |
| Antes de abrir a PR | `npm test` | 1–3 min |

A suíte inteira é responsabilidade da CI, que roda a cada PR sem consumir o seu tempo. Rodar
tudo a cada `Ctrl+S` é o que faz o teste parecer caro.

**Não existe comando que crie, apague ou recarregue o banco — de propósito.** O banco é um só e
é compartilhado: um comando desses apagaria o trabalho de cinco pessoas. Mudança na estrutura do
banco entra como arquivo novo em `db/migrations/`, aplicado à mão e avisado no grupo.

---

## Quando algo dá errado

### `node: command not found`, ou `node -v` mostra uma versão menor que 20

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

### O painel `api` mostra `Cannot find module ... server/index.js`

A API ainda não foi escrita — está numa tarefa em aberto. O site sobe normalmente e você pode
trabalhar no front. Assim que o arquivo existir, a API inicia sozinha, sem precisar reiniciar
o `npm run dev`.

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

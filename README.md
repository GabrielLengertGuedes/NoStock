# NoStock

Sistema de gestão de estoque para a **Bioma Pet Shop** (Joinville/SC).
Projeto extensionista do curso de Engenharia de Software, Centro Universitário Católica de Santa Catarina.

**Equipe:** Anttonio Osório Molinaro Maccagnini · Gabriel Lengert Guedes · Heitor Lopes Reis · João Pedro Alves de Lima · João Vitor Paranhos · Rafael Alexandre Alves Bandoch

---

## O sistema

Aplicação web para substituir o controle de estoque em planilhas e cadernos: cadastro de produtos, registro de entradas e saídas com responsável e horário, alerta de itens abaixo do mínimo, dashboard, relatórios e sugestão de compra por fornecedor.

- **Front-end:** React 18 + Vite (SPA)
- **Back-end:** Node.js 20 + Express (API REST)
- **Banco:** MySQL 8

## Instalação e Uso

Para executar o projeto localmente, siga os passos abaixo:

### Pré-requisitos
- **Node.js** v20 ou superior
- **MySQL** 8.0+ (Pode ser instalado via instalador oficial, XAMPP ou Docker)

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/GabrielLengertGuedes/NoStock.git
   cd NoStock
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Copie o arquivo de exemplo e edite com suas credenciais do banco de dados (o arquivo `.env.example` será adicionado em breve):
   ```bash
   cp .env.example .env
   ```

4. **Prepare o banco de dados:**
   Crie o schema e insira os dados iniciais:
   ```bash
   npm run db:setup
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

### Problemas Comuns
- **Erro de conexão com o MySQL:** Verifique se as variáveis `DB_HOST`, `DB_USER` e `DB_PASS` no `.env` correspondem à sua instalação.
- **Porta em uso:** Se a porta padrão (3000) estiver em uso, altere `PORT` no `.env`.

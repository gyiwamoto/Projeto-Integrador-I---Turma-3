# API - Backend (Node.js + Vercel Functions)

Esta pasta contem o backend do projeto, usando funcoes serverless da Vercel.

## Estrutura atual

```text
api/
|- _lib/
|  |- auth.ts      # JWT, autenticacao, autorizacao
|  |- db.ts        # connection pool PostgreSQL
|  |- password.ts  # bcryptjs utilities
|  |- types.ts     # TypeScript interfaces
|- auth/
|  |- login.ts     # POST /api/auth/login
|  |- me.ts        # GET /api/auth/me
|- usuarios/
|  |- index.ts     # GET /api/usuarios (lista)
|  |- [id].ts      # GET /api/usuarios/:id (buscar)
|  |- criar.ts     # POST /api/usuarios/criar
|  |- editar/
|  |  |- [id].ts   # PUT /api/usuarios/editar/:id
|  |- deletar/
|  |  |- [id].ts   # DELETE /api/usuarios/deletar/:id
|- clientes/
|  |- index.ts     # /api/clientes (protegido)
|- package.json
|- tsconfig.json
```

## Como validar localmente

```bash
# instalar dependencias da API
npm install --prefix api

# validar tipos TypeScript
npx tsc --noEmit -p api/tsconfig.json
```

## Comandos de banco (migrations)

Comandos executados a partir da raiz do repositorio:

```bash
# aplica migrations pendentes em Development
npm run db:migrate:dev --prefix api

# aplica migrations pendentes em Production
npm run db:migrate:prod --prefix api

# cria/atualiza usuario base em Development
npm run db:user:dev --prefix api -- --email "email-oficial@seudominio.com" --password "SENHA_FORTE_DEV"

# cria/atualiza usuario base em Production
npm run db:user:prod --prefix api -- --email "email-oficial@seudominio.com" --password "SENHA_FORTE_PROD"
```

Observacao: para criar novas tabelas/colunas, adicione um novo arquivo SQL em `database/migrations` com prefixo numerico (exemplo: `002_nova_tabela.sql`) e rode `db:migrate:dev`.

## Execucao local integrada (frontend + api)

Use o comando abaixo na raiz do repositorio para rodar o ambiente local da Vercel:

```bash
vercel dev
```

As rotas da API ficam disponiveis em /api/*.

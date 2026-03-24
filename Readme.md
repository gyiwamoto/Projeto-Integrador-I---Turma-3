# Dentista Organizado

Sistema de gerenciamento de consultório odontológico desenvolvido como Projeto Integrador I — UNIVESP, Turma 3, Grupo 3.

## Tecnologias

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Frontend     | Angular 21 + TypeScript + SCSS       |
| Backend      | Node.js + Vercel Serverless Functions |
| Banco de dados | PostgreSQL                          |
| Deploy       | Vercel                              |
| Controle de versão | GitHub                        |

## Estrutura do repositório

```
/
├── api/          # Vercel Serverless Functions (camada HTTP)
├── services/     # Regras de negócio compartilhadas entre rotas
├── database/     # Migrações SQL e scripts de banco
├── frontend/     # Aplicação Angular
├── docs/         # Documentação do projeto
└── vercel.json   # Configuração de build e roteamento
```

## Como executar localmente

### Pré-requisitos

- Node.js >= 22
- npm >= 10

### Frontend

```bash
cd frontend
npm install
npm start
```

Acesse `http://localhost:4200`.

### Backend (Vercel Functions)

```bash
cd api
npm install

# Instalar dependências do banco de dados (scripts de migração)
cd ../database
npm install
cd ../api

# Iniciar servidor local
vercel dev
```

As funções ficam disponíveis em `http://localhost:3000/api/*`.

### Qualidade da API

```bash
cd api
npm test
npm run type-check
```

### Banco de dados (migrations)

```bash
cd api
# aplica migrations pendentes em desenvolvimento
npm run db:migrate:dev

# aplica migrations pendentes em produção
npm run db:migrate:prod

# cria/atualiza usuário base
npm run db:user:dev -- --email "email-oficial@seudominio.com" --password "SENHA_FORTE_DEV"

# executa um SQL especifico (exemplo)
npm run db:run-sql -- ../database/migrations/008_tabela_logs_acessos.sql --env ../.env.development
```

**Importante:** As dependências do banco (`pg`, `dotenv`) já estão declaradas em `database/package.json` e serão instaladas automaticamente quando você rodar `npm install` na pasta `database`.
O comando `db:run-sql` exige o caminho do arquivo SQL como argumento.

## Deploy na Vercel

O arquivo `vercel.json` na raiz ja define o fluxo de deploy para o monorepo:

- instala dependencias de `frontend` e `api`
- faz build do Angular em `frontend`
- publica os arquivos estaticos de `frontend/dist/dentista-organizado/browser`
- expoe apenas os endpoints de API mapeados explicitamente (`/api/auth`, `/api/usuarios`, `/api/pacientes`, `/api/convenios`, `/api/consultas`, `/api/tratamentos`, `/api/procedimentos-realizados`)

## Rotas de API

- `POST /api/auth`: login
- `GET /api/auth`: validar sessao/token (rota única de auth)
- `DELETE /api/auth`: logout
- `GET /api/usuarios`: listar usuarios
- `GET /api/pacientes`: listar pacientes
- `POST /api/pacientes`: criar paciente
- `PUT /api/pacientes?id=<id>`: editar paciente
- `DELETE /api/pacientes?id=<id>`: remover paciente
- `GET /api/convenios`: listar convenios
- `GET /api/consultas`: listar consultas
- `GET /api/tratamentos`: listar tratamentos
- `GET /api/procedimentos-realizados`: listar procedimentos realizados

No painel da Vercel, configure o projeto com:

- Root Directory: `.`
- Framework Preset: `Other`
- Build and Output Settings: usar os valores do `vercel.json`

Variaveis de ambiente obrigatorias para producao:

- `DATABASE_URL`
- `JWT_SECRET`

## Variáveis de ambiente

### Desenvolvimento

Crie um arquivo `.env.development` na raiz do projeto:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/dentista_organizado
JWT_SECRET=sua-chave-secreta-dev
JWT_EXPIRES_IN=8h
BCRYPT_SALT_ROUNDS=12
DB_TIMEZONE=America/Sao_Paulo
```

### Produção

Crie um arquivo `.env.production` na raiz do projeto:

```env
DATABASE_URL=postgresql://usuario:senha@seu-host-db:5432/dentista_organizado
JWT_SECRET=sua-chave-secreta-prod-forte
JWT_EXPIRES_IN=8h
BCRYPT_SALT_ROUNDS=12
DB_TIMEZONE=America/Sao_Paulo
```

**Importante:**
- Estes arquivos devem estar na **raiz do projeto** (não dentro de `api/`)
- O script de migração procura por `.env.development` e `.env.production` na raiz
- `DB_TIMEZONE` e opcional; se nao informado, o sistema usa `America/Sao_Paulo`
- Nunca commit os arquivos `.env.development` ou `.env.production` no git

## Equipe

Projeto Integrador I — UNIVESP | Turma 3 | Grupo 3

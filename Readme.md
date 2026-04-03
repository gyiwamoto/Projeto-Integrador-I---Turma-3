# Dentista Organizado

Sistema de gerenciamento de consultório odontológico desenvolvido como Projeto Integrador I — UNIVESP, Turma 3, Grupo 3.

## Status do projeto (parcial)

- Versao atual: `1.0.0`
- Modulos ativos: autenticacao, dashboard, agenda, pacientes, consultas, convenios, tratamentos, usuarios e minha conta.
- Backend com rotas principais de CRUD e validacao de sessao.
- Banco com migrations versionadas de `001` ate `009`.
- Testes frontend executados em 2026-04-03: `205 passed (205)`.

Documentos de acompanhamento:

- Relatorio parcial: `docs/relatorioParcial.md`
- Atividades restantes do time: `tasks.md`

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

### Workspace (recomendado)

```bash
npm run install-all
npm run dev
```

Fluxo esperado:

- Frontend: `http://localhost:4200`
- API local: `http://localhost:3000`
- Frontend consumindo backend por `/api/*` via proxy Angular.

### Frontend

```bash
cd frontend
npm install
npm run start:proxy -- --port 4200
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

# Iniciar servidor local (porta 3000)
vercel dev --listen 3000
```

As funções ficam disponíveis em `http://localhost:3000/api/*`.

## Scripts da raiz

- `npm run install-all`: instala dependencias da raiz, `api`, `database` e `frontend`.
- `npm run dev`: sobe API e frontend em paralelo.
- `npm run dev:api`: sobe Vercel local em `3000` com `.env.development`.
- `npm run dev:web`: sobe Angular em `4200` com proxy.

### Qualidade do frontend

```bash
cd frontend
npm test -- --watch=false
npm run type-check
```

Resultado mais recente da suite de testes frontend:

- `19` arquivos de teste
- `205` testes passando

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
- `POST /api/convenios`: criar convenio
- `PUT /api/convenios?id=<id>`: editar convenio
- `DELETE /api/convenios?id=<id>`: remover convenio
- `GET /api/consultas`: listar consultas
- `GET /api/tratamentos`: listar tratamentos
- `POST /api/tratamentos`: criar tratamento
- `PUT /api/tratamentos?id=<id>`: editar tratamento
- `DELETE /api/tratamentos?id=<id>`: remover tratamento
- `GET /api/procedimentos-realizados`: listar procedimentos realizados

### Observacao importante sobre pacientes

- `codigo_paciente` e gerado automaticamente no servidor (migration `009_codigo_paciente_autoincremento.sql`).
- O frontend nao deve enviar `codigo_paciente` no `POST /api/pacientes`.

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

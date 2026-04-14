# API - Backend (Node.js + Vercel Functions)

Esta pasta contem o backend do projeto, usando funcoes serverless da Vercel.

## Status atual

- Versao: `1.1.0`
- Endpoints ativos para autenticacao e modulos principais (usuarios, pacientes, convenios, consultas e procedimentos realizados).
- O modulo de tratamentos foi removido e substituido por catalogo fixo de procedimentos.
- Base preparada para execucao local via `vercel dev`.
- Parte dos fluxos ainda utiliza dados mockados no frontend e sera substituida por integracoes completas nas proximas iteracoes.

## Estrutura atual

```text
api/
|- _lib/
|  |- auth.ts      # JWT, autenticacao, autorizacao
|  |- db.ts        # connection pool PostgreSQL
|  |- password.ts  # bcryptjs utilities
|  |- types.ts     # TypeScript interfaces
|- auth/
|  |- index.ts     # /api/auth (POST login, GET sessao, DELETE logout)
|- pacientes/
|  |- index.ts     # /api/pacientes (GET, POST, PUT, DELETE)
|- convenios/
|  |- index.ts     # /api/convenios (GET, POST, PUT, DELETE)
|- consultas/
|  |- index.ts     # /api/consultas (GET)
|- procedimentos-realizados/
|  |- index.ts     # /api/procedimentos-realizados (GET)
|- usuarios/
|  |- index.ts     # /api/usuarios (GET)
|- tests/
|  |- *.test.ts    # testes de suporte
|- package.json
|- tsconfig.json
```

## Rotas principais

- `POST /api/auth`: autentica usuario (login)
- `GET /api/auth`: valida token e retorna sessao
- `DELETE /api/auth`: encerra sessao
- `GET /api/usuarios`: lista usuarios (admin)
- `GET /api/pacientes`: lista pacientes (autenticado)
- `POST /api/pacientes`: cria paciente (admin)
- `PUT /api/pacientes?id=<id>`: edita paciente (autenticado)
- `DELETE /api/pacientes?id=<id>`: deleta paciente (admin)
- `GET /api/convenios`: lista convenios (autenticado)
- `POST /api/convenios`: cria convenio (autenticado)
- `PUT /api/convenios?id=<id>`: edita convenio (autenticado)
- `DELETE /api/convenios?id=<id>`: deleta convenio (admin)
- `GET /api/consultas`: lista consultas (autenticado)
- `GET /api/procedimentos-realizados`: lista procedimentos realizados (autenticado)

### Motivo da mudanca

- A remocao do endpoint `/api/tratamentos` foi uma decisao para economia de requisicoes.
- Como os dados de procedimentos mudam com baixa frequencia, o sistema passou a usar catalogo fixo, reduzindo chamadas desnecessarias e simplificando a manutencao.

### Pacientes: codigo gerado no servidor

- A coluna `codigo_paciente` possui `DEFAULT` no banco (migration `009_codigo_paciente_autoincremento.sql`).
- O backend rejeita `codigo_paciente` enviado no body de criacao.

## Controle de Acesso (RBAC)

### Admin (tipo_usuario = "admin")
- ✅ Acessar todas as rotas GET
- ✅ Criar, editar e excluir pacientes | usuarios | consultas | convenios | procedimentos realizados


### Dentista | Recepcionista (tipo_usuario = "dentista" | "recepcionista")
- ✅ Acessar todas as rotas GET permitidas
- ❌ Não podem excluir pacientes | usuarios | consultas | convenios | procedimentos realizados
- ✅ Podem editar pacientes | consultas | procedimentos realizados | convenios 


### Respostas de Autorização

| Cenário | Status | Resposta |
|---------|--------|----------|
| Sem token | 401 | `{"erro": "Token nao enviado."}` |
| Token inválido | 401 | `{"erro": "Token invalido ou expirado."}` |
| Usuario diferente de administrador tenta deletar (pacientes/convenios/procedimentos-realizados) | 403 | `{"erro": "Apenas administradores podem deletar dados."}` |
| Método não suportado | 405 | `{"erro": "Metodo nao permitido"}` |

## Como validar localmente

```bash
# instalar dependencias da API
npm install --prefix api

# validar tipos TypeScript
npx tsc --noEmit -p api/tsconfig.json
```

Observacao: no Windows, rode a API local com Node 22.x. Em Node 24.x o `vercel dev` pode falhar com erro `UV_HANDLE_CLOSING`.

## Comandos de banco (migrations)

Comandos executados a partir da raiz do repositorio:

```bash
# aplica migrations pendentes em Development
npm run db:migrate:dev --prefix api

# aplica migrations pendentes em Production
npm run db:migrate:prod --prefix api

# cria/atualiza usuario base em Development
npm run db:user:dev --prefix api -- --email "admin@example.com" --password "SENHA_FORTE"

# cria/atualiza usuario base em Production
npm run db:user:prod --prefix api -- --email "admin@example.com" --password "SENHA_FORTE"

# executa um SQL especifico
npm run db:run-sql --prefix api -- ../database/migrations/008_tabela_logs_acessos.sql --env ../.env.development
```

### Troubleshooting de Migrations

Se ao rodar `npm run db:migrate:dev` você receber erro `DATABASE_URL not defined`:

1. Certifique-se que possui arquivo `.env.development` na raiz do repositorio
2. Arquivo deve conter: `DATABASE_URL=postgresql://user:password@host:port/database`
3. Tente novamente: `npm run db:migrate:dev --prefix api`

Configuracao de timezone do banco (opcional):

1. Defina `DB_TIMEZONE=America/Sao_Paulo` no `.env`
2. Se nao definir, o sistema usa `America/Sao_Paulo` como padrao

Se ao rodar `npm run db:run-sql --prefix api` você receber mensagem de uso:

1. Passe o caminho do arquivo SQL apos `--`
2. Exemplo: `npm run db:run-sql --prefix api -- ../database/migrations/008_tabela_logs_acessos.sql --env ../.env.development`

Observacao: Para criar novas tabelas/colunas, adicione um novo arquivo SQL em `database/migrations/` com prefixo numerico (exemplo: `009_nova_tabela.sql`) e rode `npm run db:migrate:dev --prefix api`.

## Execucao local integrada (frontend + api)

Use o comando abaixo na raiz do repositorio para rodar o ambiente local da Vercel:

```bash
vercel dev
```

As rotas da API ficam disponiveis em /api/*.

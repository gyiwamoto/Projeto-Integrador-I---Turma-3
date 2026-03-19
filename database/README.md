# Database - Banco de Dados

Esta pasta guarda as migrations SQL versionadas do projeto.

## Estrutura atual

```
database/
|- migrations/
|  |- 001_tabela_usuarios.sql
|- README.md
```

## Objetivo

Facilitar criacao e alteracao de tabelas em Development e Production com os mesmos comandos.

## Fluxo recomendado

1. Criar uma nova migration em `database/migrations` com prefixo numerico.
2. Rodar `db:migrate:dev` para aplicar todas as migrations pendentes no Development.
3. Validar no ambiente de desenvolvimento.
4. Rodar `db:migrate:prod` para aplicar as mesmas migrations pendentes no Production.

Exemplo de nome de migration:

- `002_adicionar_coluna_telefone_usuarios.sql`

## Comandos

A partir da raiz do repositorio:

```bash
npm install --prefix api

# Aplica pendencias em Development
npm run db:migrate:dev --prefix api

# Aplica pendencias em Production
npm run db:migrate:prod --prefix api

# Cria/atualiza usuario base por email
npm run db:user:dev --prefix api -- --email "email-oficial@seudominio.com" --password "SENHA_FORTE_DEV"
npm run db:user:prod --prefix api -- --email "email-oficial@seudominio.com" --password "SENHA_FORTE_PROD"
```

## Como funciona internamente

- O script de migration aplica apenas arquivos pendentes que seguem o padrao `NNN_nome.sql`.
- O historico de execucao fica salvo na tabela `schema_migrations`.
- O script utilitario `db:run-sql` continua disponivel para executar um arquivo SQL especifico.

## Scripts de suporte

- `api/scripts/db-migrate-all.mjs`
- `api/scripts/db-run-sql.mjs`
- `api/scripts/db-upsert-base-user.mjs`

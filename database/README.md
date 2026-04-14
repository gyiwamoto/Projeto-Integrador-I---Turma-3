# Database - Banco de Dados

Esta pasta guarda as migrations SQL versionadas do projeto.

## Status atual

- Versao: `1.0.0`
- Migrations disponiveis: `001` ate `013`
- Estrutura principal do dominio clinico ativa para usuarios, pacientes, convenios, consultas, procedimentos e logs.
- A tabela `tratamentos` foi removida na migration `011` por decisao de economia de requisicoes, ja que esses dados mudam com baixa frequencia e passaram para catalogo fixo.
- Proximas etapas incluem ajustes de performance, mais seeds para homologacao e evolucoes para relatorios gerenciais.

## Estrutura atual

```
database/
|- migrations/
|  |- 001_tabela_usuarios.sql
|  |- 002_tabela_pacientes.sql
|  |- 003_tabela_convenios.sql
|  |- 004_relacionamento_pacientes_convenios.sql
|  |- 005_tabela_tratamentos.sql
|  |- 006_tabela_consultas.sql
|  |- 007_tabela_procedimentos_realizados.sql
|  |- 008_tabela_logs_acessos.sql
|  |- 009_codigo_paciente_autoincremento.sql
|  |- 010_adicionar_cnpj_convenios.sql
|  |- 011_remover_tratamentos_e_ajustar_procedimentos.sql
|  |- 012_adicionar_duracao_e_procedimentos_consultas.sql
|  |- 013_datas_em_horario_brasil.sql
|- scripts/
|  |- db-migrate-all.mjs
|  |- db-run-sql.mjs
|  |- db-upsert-base-user.mjs
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

- `009_adicionar_coluna_xxx.sql`

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

# Executa um SQL especifico
npm run db:run-sql --prefix api -- ../database/migrations/008_tabela_logs_acessos.sql --env ../.env.development
```

Observacao: `db:run-sql` exige obrigatoriamente o caminho do arquivo `.sql` como primeiro argumento apos `--`.
Observacao: `DB_TIMEZONE` e opcional; se nao informado, o padrao utilizado e `America/Sao_Paulo`.

## Como funciona internamente

- O script de migration aplica apenas arquivos pendentes que seguem o padrao `NNN_nome.sql`.
- O historico de execucao fica salvo na tabela `schema_migrations`.
- O script utilitario `db:run-sql` continua disponivel para executar um arquivo SQL especifico.
- Os scripts aplicam timezone de sessao via `DB_TIMEZONE` (padrao `America/Sao_Paulo`).

## Scripts de suporte

- `database/scripts/db-migrate-all.mjs`
- `database/scripts/db-run-sql.mjs`
- `database/scripts/db-upsert-base-user.mjs`

## Estrutura inicial das tabelas

### usuarios

Responsavel por armazenar os usuarios que terao acesso ao sistema.

- id (PK)
- nome
- email
- senha_hash
- tipo_usuario (admin / dentista / recepcionista)
- ativo
- criado_em

### pacientes

Tabela de cadastro dos pacientes da clinica.

- id (PK)
- codigo_paciente
- nome
- data_nascimento
- telefone
- whatsapp_push
- email
- convenio_cnpj (FK convenios)
- numero_carteirinha
- criado_em

Observacao:

- A migration `009_codigo_paciente_autoincremento.sql` cria a sequencia `pacientes_codigo_seq`
	e configura `codigo_paciente` com `DEFAULT` no formato `P00001`.

### convenios

Tabela de convenios aceitos pela clinica.

- id (PK)
- nome
- ativo
- criado_em
- atualizado_em

### tratamentos

Tabela removida na migration `011_remover_tratamentos_e_ajustar_procedimentos.sql`.

Motivo: reduzir requisicoes para dados de baixa variacao, migrando para catalogo fixo de procedimentos.

### consultas

Registra os atendimentos agendados e realizados.

- id (PK)
- paciente_id (FK pacientes)
- usuario_id (FK usuarios)
- data_consulta
- status (agendado / realizado / cancelado)
- convenio_cnpj (FK convenios, opcional)
- numero_carteirinha
- observacoes
- procedimentos_agendados (catalogo fixo)
- duracao_estimada_min
- criado_em

### procedimentos_realizados

Relaciona os procedimentos executados em uma consulta.

- id (PK)
- consulta_id (FK consultas)
- tratamento_id (codigo de procedimento em catalogo fixo)
- dente
- face
- data_procedimento
- observacoes
- criado_em

### logs_acessos

Tabela de auditoria de acessos e tentativas de autenticacao/uso da API.

- id (PK)
- usuario_id (FK usuarios, opcional)
- email_informado
- ip_origem
- user_agent
- rota
- metodo_http
- status_http
- sucesso
- mensagem
- criado_em

Obs:

- PK (Primary Key) - chave primaria
- FK (Foreign Key) - chave estrangeira

## Relacionamentos

- convenios -> pacientes
- convenios -> consultas
- pacientes -> consultas
- usuarios -> consultas
- usuarios -> logs_acessos
- consultas -> procedimentos_realizados

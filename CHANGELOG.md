# Changelog

## 1.1.0 - 2026-04-14

### Correcao de fluxo (agenda, consultas e atendimento)

- Ajustes no fluxo de reagendamento para atualizacao deterministica da listagem, limpeza de query params e recarga consistente de dados.
- Migracao das telas de consultas e atendimento de painel lateral para modal em tela cheia, com melhor comportamento responsivo.
- Correcao do fechamento de modais apos finalizacao de consulta no fluxo de atendimento.

### Datas e validacoes

- Padronizacao de envio e exibicao de datas de procedimentos para evitar erros de validacao no backend.
- Normalizacao de datas de saida de procedimentos diretamente no backend para manter consistencia de apresentacao no frontend.

### Seguranca e regras de negocio

- Inclusao de confirmacao por senha antes de marcar consulta como concluida.
- Ajuste da validacao de credenciais de administrador para evitar falhas de identificacao por ID em fluxos de finalizacao.

### Refatoracao tecnica

- Criacao de utilitario compartilhado de request nos services para reduzir duplicacao de parse de body, extracao de id e tratamento de erro de autenticacao.
- Consolidacao de formatacao de data em utilitario central (`api/_lib/date-time.ts`) e reaproveitamento pelos services.

### Documentacao e versao

- Alinhamento de versao para `1.1.0` nos pacotes da raiz, API, frontend e database.
- Atualizacao dos README(s) com status e versao do release atual.

## 1.0.1 - 2026-04-13

### Alteracoes principais

- Remocao do modulo de tratamentos no frontend e backend (`/api/tratamentos`).
- Adocao de catalogo fixo de procedimentos (codigos) para uso em consultas e procedimentos realizados.
- Migracao `011_remover_tratamentos_e_ajustar_procedimentos.sql` aplicada para remover tabela `tratamentos` e desvincular a FK antiga.

### Motivo da decisao

- Essa mudanca foi uma escolha de arquitetura para economia de requisicoes.
- Os dados de procedimentos mudam com baixa frequencia, entao passaram a ser tratados como catalogo fixo em vez de CRUD dedicado, reduzindo chamadas de API e complexidade operacional.

## 1.0.0 - 2026-04-03

Primeira versao estavel do projeto para fechamento do ciclo inicial.

### Implementado e pronto

- Frontend com paginas de login, dashboard, agenda, consultas, pacientes, convenios, tratamentos, usuarios e minha conta.
- Componentes compartilhados consolidados (filtros, modal, sidebar, tabela, toast-container e agenda-calendario).
- API serverless com autenticacao e rotas principais de CRUD para pacientes, convenios e tratamentos.
- Listagens ativas para consultas e procedimentos realizados.
- Banco PostgreSQL com migrations `001` a `009`, incluindo geracao automatica de `codigo_paciente`.
- Suite de testes frontend estabilizada com `205 passed (205)`.
- Documentacao principal atualizada (README da raiz, API, frontend, database, relatorio parcial e tasks).

### Ainda mockado ou parcial

- Dashboard ainda usa parte dos indicadores com dados mockados (sem agregacao completa do backend).
- Agenda ainda possui trechos de fluxo local sem persistencia integral de todos os eventos no backend.
- Integracao com Google Calendar ainda nao implementada.
- Disparo de mensagens por WhatsApp ainda nao implementado.
- Fluxo completo de procedimentos realizados na interface ainda pendente de evolucao.

## 1.0.0-rc.2 - 2026-04-03

- Correcao e estabilizacao dos testes de componentes reutilizaveis (sidebar, filtros e agenda-calendario).
- Simplificacao dos testes para foco funcional, evitando validacoes visuais fragis.
- Criacao de testes funcionais para todas as paginas em `frontend/src/app/pages/*`.
- Suite de testes frontend validada com `205 passed (205)`.
- Atualizacao da documentacao principal (README da raiz, API, frontend e database).
- Inclusao do relatorio parcial academico em `docs/relatorioParcial.md`.
- Inclusao do plano de pendencias do time em `tasks.md`.

## 1.0.0-rc.1 - 2026-04-02

- Refatoracao da tela de pacientes para usar campos alinhados ao banco e API.
- Ajuste do fluxo de pacientes para respeitar `codigo_paciente` gerado no servidor.
- Melhoria visual do primeiro modal de acao na tela de agenda.
- Inclusao de "Meus agendamentos" na tela Minha Conta para dentista e admin.
- Atualizacao dos READMEs (raiz, api, frontend e database) com regras e rotas atuais.

## 1.0.0-rc.0 - 2026-04-02

- Padronizacao da estrutura monorepo com scripts de orquestracao na raiz.
- Adicao de proxy Angular para encaminhamento de chamadas /api para localhost:3000.
- Adicao e ampliacao da configuracao local de funcoes em vercel.api.local.json.
- Refatoracao do frontend para fluxo login -> dashboard com shell autenticado.
- Inclusao de sidebar com controle de visibilidade para a area de usuarios (apenas admin).
- Implementacao de modal reutilizavel com suporte a ESC e clique fora.
- Refatoracao das telas de pacientes e agendamento com fluxo integrado.
- Ajustes de versao para o release candidate 1.0.0-rc.0.

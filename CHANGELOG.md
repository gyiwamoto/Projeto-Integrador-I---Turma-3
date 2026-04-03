# Changelog

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

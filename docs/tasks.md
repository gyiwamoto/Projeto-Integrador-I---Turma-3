# Tasks Pendentes do Projeto

## 1. Persistir agendamento na API

Onde alterar:
- `frontend/src/app/pages/agenda/agenda.component.ts`
- `frontend/src/app/services/agenda.service.ts`
- `api/consultas/index.ts`

Tarefa:
- Trocar o fluxo local de agendamento por `POST /api/consultas`.

## 2. Cancelar consulta pela agenda

Onde alterar:
- `frontend/src/app/pages/agenda/agenda.component.ts`
- `frontend/src/app/pages/consultas/consultas.component.ts`
- `frontend/src/app/services/agenda.service.ts`
- `api/consultas/index.ts`

Tarefa:
- Adicionar acao para cancelar consulta e atualizar status para `cancelado`.

## 3. Marcar consulta como realizada

Onde alterar:
- `frontend/src/app/pages/consultas/consultas.component.ts`
- `frontend/src/app/services/agenda.service.ts`
- `api/consultas/index.ts`

Tarefa:
- Criar acao de conclusao de consulta com persistencia no backend.

## 4. Dashboard com dados reais

Onde alterar:
- `frontend/src/app/pages/dashboard/dashboard.component.ts`
- `frontend/src/app/services/agenda.service.ts`
- `api/consultas/index.ts`
- `api/procedimentos-realizados/index.ts`

Tarefa:
- Substituir dados mockados por agregacoes reais de consultas e procedimentos.

## 5. Endpoint de resumo gerencial

Onde alterar:
- `api/dashboard/index.ts` (novo)
- `services/consultas.service.ts`
- `services/procedimentosRealizados.service.ts`

Tarefa:
- Criar endpoint `/api/dashboard` com totais do dia, cancelamentos e faturamento por periodo.

## 6. Procedimentos realizados na UI

Onde alterar:
- `frontend/src/app/pages/consultas/consultas.component.ts`
- `frontend/src/app/services/procedimentos-realizados.service.ts` (novo)
- `api/procedimentos-realizados/index.ts`
- `services/procedimentosRealizados.service.ts`

Tarefa:
- Permitir cadastrar e listar procedimentos vinculados a cada consulta.

## 7. Validar carteirinha por convenio

Onde alterar:
- `frontend/src/app/pages/pacientes/pacientes.component.ts`
- `frontend/src/app/pages/agenda/agenda.component.ts`
- `api/pacientes/index.ts`
- `api/consultas/index.ts`

Tarefa:
- Bloquear agendamento quando convenio exige carteirinha e campo estiver vazio.

## 8. Filtro por profissional em consultas

Onde alterar:
- `frontend/src/app/pages/consultas/consultas.component.ts`
- `frontend/src/app/components/filtros/filtros.component.ts`

Tarefa:
- Adicionar filtro de profissional e aplicar na listagem.

## 9. Busca de paciente por codigo na agenda

Onde alterar:
- `frontend/src/app/pages/agenda/agenda.component.ts`

Tarefa:
- Priorizar busca por `codigoPaciente` no modal de selecao de paciente.

## 10. Pagina de logs de acesso

Onde alterar:
- `frontend/src/app/pages/logs-acessos/` (novo)
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/services/logs-acessos.service.ts` (novo)
- `api/logs-acessos/index.ts` (novo)
- `services/logsAcessos.service.ts`

Tarefa:
- Criar tela administrativa para consultar logs de acesso e tentativas de login.

## 11. Tratamento de sessao expirada

Onde alterar:
- `frontend/src/app/services/auth.service.ts`
- `frontend/src/app/guards/auth.guard.ts`
- `frontend/src/app/services/agenda.service.ts`
- `frontend/src/app/services/pacientes.service.ts`
- `frontend/src/app/services/convenios.service.ts`
- `frontend/src/app/services/tratamentos.service.ts`
- `frontend/src/app/services/usuarios.service.ts`

Tarefa:
- Padronizar redirecionamento para login quando API retornar `401`.

## 12. Padrao unico de erro na API

Onde alterar:
- `api/_lib/types.ts`
- `api/*/index.ts`

Tarefa:
- Unificar formato de resposta de erro (`codigo`, `mensagem`, `detalhes`).

## 13. Testes de erro em paginas criticas

Onde alterar:
- `frontend/src/app/pages/agenda/agenda.component.spec.ts`
- `frontend/src/app/pages/pacientes/pacientes.component.spec.ts`
- `frontend/src/app/pages/minha-conta/minha-conta.component.spec.ts`

Tarefa:
- Cobrir falhas de API, validacao de formulario e estados de loading.

## 14. Testes da API para CRUD completo

Onde alterar:
- `api/consultas/index.test.ts`
- `api/procedimentos-realizados/index.test.ts`
- `api/convenios/index.test.ts`

Tarefa:
- Cobrir fluxos de sucesso e proibicao por perfil (`admin`, `dentista`, `recepcionista`).

## 15. Revisao final de documentacao

Onde alterar:
- `Readme.md`
- `api/README.md`
- `frontend/README.md`
- `database/README.md`
- `docs/relatorioParcial.md`

Tarefa:
- Atualizar exemplos de fluxo com funcionalidades realmente integradas (sem mock).

## 16. Integracao da agenda com Google Calendar

Onde alterar:
- `frontend/src/app/pages/agenda/agenda.component.ts`
- `frontend/src/app/services/agenda.service.ts`
- `api/integracoes/google-calendar/index.ts` (novo)
- `services/consultas.service.ts`

Tarefa:
- Criar sincronizacao de consulta com Google Calendar (criar, atualizar e cancelar evento).

## 17. Disparo de mensagens no WhatsApp

Onde alterar:
- `frontend/src/app/pages/agenda/agenda.component.ts`
- `frontend/src/app/pages/consultas/consultas.component.ts`
- `api/integracoes/whatsapp/index.ts` (novo)
- `services/consultas.service.ts`
- `services/logsAcessos.service.ts`

Tarefa:
- Enviar mensagem de confirmacao e lembrete de consulta via WhatsApp para pacientes com `whatsapp_push = true`.

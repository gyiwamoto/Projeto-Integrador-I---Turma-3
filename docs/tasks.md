# Tasks Pendentes do Projeto

## 📋 Mapeamento de APIs: Prontas vs Mockadas vs Faltando

### ✅ APIs Prontas (GET - Leitura)

| Funcionalidade | Endpoint | Schema de Resposta | Frontend |
|---|---|---|---|
| Listar consultas | GET /api/consultas | `{ id, paciente_id, paciente_nome, usuario_id, usuario_nome, status, data_consulta, convenio_id, convenio_nome, criado_em }` | ✅ AgendaService.listarConsultas() |
| Listar pacientes | GET /api/pacientes | `{ id, codigo_paciente, nome, data_nascimento, telefone, whatsapp_push, email, convenio_id, numero_carteirinha, criado_em }` | ✅ AgendaService.listarPacientes() |
| Listar tratamentos | GET /api/tratamentos | `{ id, nome, descricao, valor, ativo, criado_em, atualizado_em }` | ✅ TratamentosService.listarTratamentos() |
| Listar convênios | GET /api/convenios | `{ id, nome, ativo, criado_em, atualizado_em }` | ✅ ConveniosService.listarConvenios() |
| Listar usuários | GET /api/usuarios | `{ id, nome, email, tipo_usuario, ativo, criado_em }` | ✅ UsuariosService.listarUsuarios() |

### ❌ APIs Faltando (Bloqueiam Integração)

| Funcionalidade | Endpoint | Body Esperado | Prioridade | Status |
|---|---|---|---|---|
| **Criar consulta** | POST /api/consultas | `{ paciente_id, usuario_id, data_consulta, convenio_id, numero_carteirinha, observacoes }` | **P0** | ❌ B1 |
| **Atualizar status consulta** | PUT /api/consultas/:id | `{ status: "agendado\|realizado\|cancelado" }` | **P0** | ❌ B2 |
| **Cancelar consulta** | DELETE /api/consultas/:id | `{ motivo? }` | **P0** | ❌ B3 |
| **Dashboard indicadores** | GET /api/dashboard/resumo | - (com agregações reais) | **P0** | ❌ B4 |
| **Registrar procedimento** | POST /api/procedimentos-realizados | `{ consulta_id, tratamento_id, dente, face, data_procedimento, observacoes }` | **P1** | ❌ B5 |
| **Logs de acesso** | GET /api/logs-acessos | Query params opcionais | **P1** | ❌ B6 |

### 📊 Dados Mockados no Frontend

**Dashboard (`frontend/src/app/pages/dashboard/dashboard.component.ts`)**
- `consultasHoje = 18` (hardcoded)
- `confirmacoesHoje = 13` (hardcoded)
- `cancelamentosHoje = 2` (hardcoded)
- `pacientesAtivos = 248` (hardcoded)
- `periodosFaturamento` (valores estáticos por período)
- `graficoFaturamento` (31 dias com valores calculados)
- `proximasConsultas[]` (3 entradas mockadas)
- `procedimentosMaisRealizados[]` (percentuais hardcoded)
- `conveniosUtilizados[]` (dados estáticos)

**Agenda (`frontend/src/app/pages/agenda/agenda.component.ts`)**
- `registrarAgendamentoLocal()` cria ID fake "local-{timestamp}-{random}" (não persiste)

---

## 🔴 BACKEND TASKS - CRÍTICAS (P0)

### B1: Implementar POST /api/consultas - Criar Consulta

**Descrição:**  
Implementar funcionalidade completa de criação de consulta no backend e integrar no frontend. Substituir o mock local (`registrarAgendamentoLocal()`) por persistência real no banco de dados. A consulta deve ser validada, auditada e retornar o ID gerado.

**Arquivos a criar:**
- Nenhum novo arquivo necessário (API handler já existe, precisa implementar POST)

**Arquivos a modificar (Backend):**
- `api/consultas/index.ts` - Adicionar case `'POST'` no handler que valida body e chama `criarConsulta()`
- `services/consultas.service.ts` - Implementar `async function criarConsulta(req)` com:
  - Validação de paciente_id, usuario_id, data_consulta, convenio_id (opcional)
  - INSERT em tabela `consultas`
  - Log de auditoria em `logs_acessos`
  - Retorno do ID criado

**Arquivos a modificar (Frontend):**
- `frontend/src/app/pages/agenda/agenda.component.ts` - Remover chamada a `registrarAgendamentoLocal()`, chamar `agendaService.criarConsulta()`
- `frontend/src/app/services/agenda.service.ts` - Adicionar método `criarConsulta(paciente_id, usuario_id, data_consulta, convenio_id?, observacoes?): Observable<{ id: string }>`

**Request Schema:**
```json
{
  "paciente_id": "uuid (required)",
  "usuario_id": "uuid (required)",
  "data_consulta": "ISO8601 (required)",
  "convenio_id": "uuid (optional, null para particular)",
  "numero_carteirinha": "string (optional)",
  "observacoes": "string (optional)"
}
```

**Response Schema (201 Created):**
```json
{
  "id": "uuid",
  "mensagem": "Consulta agendada com sucesso.",
  "consulta": {
    "id": "uuid",
    "paciente_id": "uuid",
    "usuario_id": "uuid",
    "data_consulta": "ISO8601",
    "status": "agendado",
    "criado_em": "ISO8601"
  }
}
```

**Error Schema (400/401/403):**
```json
{
  "erro": "InvalidInput|Unauthorized|Forbidden",
  "mensagem": "Descrição amigável do erro",
  "detalhes": { "campo": "mensagem de validação" }
}
```

**Permissões:** Dentista, Recepcionista, Admin  
**Headers esperados:** Authorization: Bearer {token}

---

### B2: Implementar PUT /api/consultas/:id - Atualizar Status de Consulta

**Descrição:**  
Implementar atualização de status de consulta (agendado → realizado ou cancelado). Incluir validação de permissão (dentista só pode editar suas consultas), auditoria e opcionalmente integração com WhatsApp para notificação. Criar componentes/botões no frontend para ação.

**Arquivos a criar:**
- Nenhum

**Arquivos a modificar (Backend):**
- `api/consultas/index.ts` - Adicionar case `'PUT'` que extrai `:id` e chama `atualizarStatusConsulta()`
- `services/consultas.service.ts` - Implementar `async function atualizarStatusConsulta(id, status, usuario_id)` com:
  - Validação se consulta existe
  - Validação de permissão (dentista = própria consulta, admin = qualquer uma)
  - UPDATE na tabela `consultas` com novo status
  - Log em `logs_acessos`
  - Se status='realizado' e whatsapp_push=true, disparar notificação (async)

**Arquivos a modificar (Frontend):**
- `frontend/src/app/pages/consultas/consultas.component.ts` - Adicionar botões "Marcar como Realizado" e "Cancelar" na tabela (coluna de ações)
- `frontend/src/app/pages/agenda/agenda.component.ts` - Adicionar menu/dropdown com opção de cancelamento rápido
- `frontend/src/app/services/agenda.service.ts` - Adicionar método `atualizarStatusConsulta(id, novoStatus): Observable<any>`

**Request Schema:**
```json
{
  "status": "realizado | cancelado (required)",
  "motivo_cancelamento": "string (optional, obrigatório se status=cancelado)"
}
```

**Response Schema (200 OK):**
```json
{
  "mensagem": "Consulta atualizada com sucesso.",
  "consulta": {
    "id": "uuid",
    "status": "realizado | cancelado",
    "atualizado_em": "ISO8601"
  }
}
```

**Permissões:** Dentista (própria consulta), Admin (qualquer consulta)  
**Headers esperados:** Authorization: Bearer {token}

---

### B3: Implementar DELETE /api/consultas/:id - Cancelar Consulta

**Descrição:**  
Implementar cancelamento de consulta (soft delete - muda status para 'cancelado'). Pode ser complemento ao B2 ou alternativa. Enviar notificação ao paciente se habilitado.

**Arquivos a criar:**
- Nenhum

**Arquivos a modificar (Backend):**
- `api/consultas/index.ts` - Adicionar case `'DELETE'` que extrai `:id` e chama `cancelarConsulta()`
- `services/consultas.service.ts` - Implementar `async function cancelarConsulta(id, usuario_id, motivo?)` com:
  - Validação se consulta existe
  - UPDATE status='cancelado'
  - Armazena motivo (opcional)
  - Log em `logs_acessos`
  - Notificação WhatsApp se aplicável

**Arquivos a modificar (Frontend):**
- `frontend/src/app/pages/consultas/consultas.component.ts` - Ícone/botão de lixeira para cancelamento rápido (com confirmação)
- `frontend/src/app/services/agenda.service.ts` - Adicionar método `cancelarConsulta(id): Observable<any>`

**Request Schema:**
```json
{
  "motivo": "string (optional)"
}
```

**Response Schema (200 OK ou 204 No Content):**
```json
{
  "mensagem": "Consulta cancelada com sucesso."
}
```

**Permissões:** Dentista (própria consulta), Admin  
**Headers esperados:** Authorization: Bearer {token}

---

### B4: Implementar GET /api/dashboard/resumo - Endpoint de Analytics

**Descrição:**  
Criar novo endpoint que retorna indicadores gerenciais em tempo real (KPIs do dia, faturamento, procedimentos mais realizados, convênios utilizados). Substituir todos os dados hardcoded do dashboard por chamadas REST reais. Criar novo serviço frontend para consumir esse endpoint.

**Arquivos a criar (Backend):**
- `api/dashboard/index.ts` - Novo handler que orquestra chamadas a funções de agregação e retorna JSON estruturado

**Arquivos a criar (Frontend):**
- `frontend/src/app/services/dashboard.service.ts` - Novo serviço Angular com método `obterResumo(periodo?: string): Observable<DashboardResumo>`

**Arquivos a modificar (Backend):**
- `services/consultas.service.ts` - Implementar funções de agregação:
  - `async function contarConsultasHoje(usuario_id?): Promise<number>` - Conta consultas com data_consulta = hoje
  - `async function contarConfirmacoesHoje(usuario_id?): Promise<number>` - Conta consultas realizado hoje
  - `async function contarCancelamentosHoje(usuario_id?): Promise<number>` - Conta consultas cancelado hoje
  - `async function contarPacientesAtivos(): Promise<number>` - Conta pacientes com pelo menos 1 consulta
  - `async function obterProximasConsultas(limite=5): Promise<Array>` - Retorna próximas 5 consultas agendadas
  - `async function obterFaturamentoPorPeriodo(periodo='mensal'): Promise<object>` - Soma valores de consultas por período
  - `async function obterGraficoFaturamento(periodo='mensal'): Promise<Array>` - Retorna série temporal de faturamento (últimos 31 dias ou meses)
  - `async function obterProcedimentosMaisRealizados(limite=5): Promise<Array>` - Retorna TOP 5 procedimentos por frequência com percentual

**Arquivos a modificar (Frontend):**
- `frontend/src/app/pages/dashboard/dashboard.component.ts` - Remover propriedades readonly hardcoded, substituir por `ngOnInit()` que chama `dashboardService.obterResumo()` e atribui a properties
- `frontend/src/app/pages/dashboard/dashboard.component.ts` - Adicionar tratamento de loading e erro

**Request Schema:**
```
GET /api/dashboard/resumo?periodo=mensal

Query params:
- periodo: string (optional) - valores: "diario|semanal|mensal|trimestral|anual" (default: "mensal")
```

**Response Schema (200 OK):**
```json
{
  "consultasHoje": 18,
  "confirmacoesHoje": 13,
  "cancelamentosHoje": 2,
  "pacientesAtivos": 248,
  "pacientesNovosNoPeriodo": 15,
  "faturamento": {
    "valor": 42870.00,
    "meta": 60000.00,
    "crescimento": 12
  },
  "graficoFaturamento": [
    { "rotulo": "01", "valor": 1200.00, "meta": 2000.00 },
    { "rotulo": "02", "valor": 1350.00, "meta": 2000.00 }
  ],
  "proximasConsultas": [
    {
      "id": "uuid",
      "horario": "09:30",
      "paciente": "Mariana Souza",
      "profissional": "Dra. Beatriz",
      "procedimento": "Avaliação de rotina",
      "data_consulta": "2026-04-10T09:30:00Z"
    }
  ],
  "procedimentosMaisRealizados": [
    { "id": "uuid", "nome": "Profilaxia", "total": 34, "percentual": 29 },
    { "id": "uuid", "nome": "Avaliação inicial", "total": 27, "percentual": 23 }
  ],
  "conveniosUtilizados": [
    { "id": "uuid", "nome": "Particular", "consultas": 41, "percentual": 35 },
    { "id": "uuid", "nome": "OdontoPlus", "consultas": 32, "percentual": 27 }
  ]
}
```

**Permissões:** Admin (todos os dados), Dentista (apenas seus dados filtrando por usuario_id)  
**Headers esperados:** Authorization: Bearer {token}

---

## 🟡 BACKEND TASKS - SECUNDÁRIAS (P1)

### B5: Implementar POST /api/procedimentos-realizados - Registrar Procedimento

**Descrição:**  
Implementar registro de procedimentos realizados durante uma consulta. Cada procedimento vincula-se a um dente, face, tratamento e armazena observações. Criar componentes modal/página para adicionar procedimentos numa consulta, com validação de nomenclatura odontológica.

**Arquivos a criar (Backend):**
- Nenhum (tabela já existe)

**Arquivos a criar (Frontend - Serviço):**
- `frontend/src/app/services/procedimentos-realizados.service.ts` - Novo serviço com métodos:
  - `criarProcedimento(dados): Observable<any>`
  - `listarPorConsulta(consultaId): Observable<any>`
  - `deletarProcedimento(id): Observable<any>`

**Arquivos a criar (Frontend - Componentes):**
- `frontend/src/app/components/modal-procedimento/modal-procedimento.component.ts` - Modal para adicionar procedimento numa consulta
- `frontend/src/app/components/modal-procedimento/modal-procedimento.component.html`
- `frontend/src/app/components/modal-procedimento/modal-procedimento.component.scss`
- `frontend/src/app/components/modal-procedimento/modal-procedimento.component.spec.ts`

**Arquivos a modificar (Backend):**
- `api/procedimentos-realizados/index.ts` - Adicionar case `'POST'` que chama `criarProcedimento()`
- `services/procedimentosRealizados.service.ts` - Implementar `async function criarProcedimento(req)` com:
  - Validação de dente (numérico 11-48)
  - Validação de face (V, P, M, D, L, O)
  - Validação de tratamento_id existe
  - Validação de consulta_id existe
  - INSERT em tabela
  - Log em `logs_acessos`

**Arquivos a modificar (Frontend):**
- `frontend/src/app/pages/consultas/consultas.component.ts` - Adicionar coluna "Procedimentos" na tabela de consultas, botão "Adicionar Procedimento" que dispara modal
- `frontend/src/app/pages/consultas/consultas.component.ts` - Após modal fechar, recarregar lista de procedimentos da consulta
- `frontend/src/app/pages/consultas/consultas.component.html` - Adicionar HTML da coluna e botão no template

**Request Schema:**
```json
{
  "consulta_id": "uuid (required)",
  "tratamento_id": "uuid (required)",
  "dente": "11-48 (required, número do dente na nomenclatura internacional)",
  "face": "V|P|M|D|L|O (required, Vestibular|Palatina|Mesial|Distal|Lingual|Oclusal)",
  "data_procedimento": "ISO8601 (required)",
  "observacoes": "string (optional)"
}
```

**Response Schema (201 Created):**
```json
{
  "id": "uuid",
  "mensagem": "Procedimento registrado com sucesso.",
  "procedimento": {
    "id": "uuid",
    "consulta_id": "uuid",
    "tratamento_id": "uuid",
    "tratamento_nome": "Profilaxia",
    "dente": "11",
    "face": "V",
    "data_procedimento": "ISO8601",
    "criado_em": "ISO8601"
  }
}
```

**Permissões:** Dentista (própria consulta), Admin  
**Headers esperados:** Authorization: Bearer {token}

---

### B6: Implementar GET /api/logs-acessos - Listar Logs de Acesso

**Descrição:**  
Implementar listagem de logs de acesso com filtros avançados (usuário, data, tipo de evento). Criar página administrativa para auditoria com tabela paginada, filtros e busca. Apenas admin pode acessar.

**Arquivos a criar (Backend):**
- `api/logs-acessos/index.ts` - Novo handler GET que chama `listarLogs()` com tratamento de query params

**Arquivos a criar (Frontend - Serviço):**
- `frontend/src/app/services/logs-acessos.service.ts` - Novo serviço com método:
  - `listarLogs(filtros?: { usuario_id?, data_inicio?, data_fim?, evento?, pagina? }): Observable<any>`

**Arquivos a criar (Frontend - Página):**
- `frontend/src/app/pages/logs-acessos/logs-acessos.component.ts` - Componente de página
- `frontend/src/app/pages/logs-acessos/logs-acessos.component.html` - Template com tabela paginada
- `frontend/src/app/pages/logs-acessos/logs-acessos.component.scss` - Estilos
- `frontend/src/app/pages/logs-acessos/logs-acessos.component.spec.ts` - Testes

**Arquivos a modificar (Backend):**
- `services/logsAcessos.service.ts` - Implementar `async function listarLogs(filtros)` com:
  - SELECT com WHERE dinâmico para usuario_id, data_inicio, data_fim, tipo_evento
  - Paginação (LIMIT, OFFSET) baseada em query param `pagina`
  - Ordenação reverse chronological (criado_em DESC)
  - COUNT total para saber total de páginas
  - Retorna array estruturado

**Arquivos a modificar (Frontend):**
- `frontend/src/app/app.routes.ts` - Adicionar rota `{ path: 'logs-acessos', component: LogsAcessosComponent }` (dentro de guard ADMIN)
- `frontend/src/app/components/sidebar/sidebar.component.ts` - Adicionar link "Logs de Acesso" (visível apenas para admin)
- `frontend/src/app/components/sidebar/sidebar.component.html` - Adicionar HTML do link

**Request Schema:**
```
GET /api/logs-acessos?usuario_id=uuid&data_inicio=2026-04-01&data_fim=2026-04-04&evento=login&pagina=1

Query params (todos opcionais):
- usuario_id: uuid
- data_inicio: ISO8601 ou YYYY-MM-DD
- data_fim: ISO8601 ou YYYY-MM-DD
- evento: "login|logout|falha|acao" (pode ser múltiplo com OR)
- pagina: number (default: 1)
- limite: number (default: 25, max: 100)
```

**Response Schema (200 OK):**
```json
{
  "total": 150,
  "pagina": 1,
  "total_paginas": 6,
  "limite": 25,
  "logs": [
    {
      "id": "uuid",
      "usuario_id": "uuid",
      "usuario_nome": "Dra. Beatriz",
      "email_informado": "beatriz@clinica.com",
      "ip_origem": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "rota": "/api/auth",
      "metodo_http": "POST",
      "status_http": 200,
      "sucesso": true,
      "tipo_evento": "login",
      "mensagem": "Login realizado com sucesso.",
      "criado_em": "2026-04-03T10:45:00Z"
    }
  ]
}
```

**Permissões:** Admin only  
**Headers esperados:** Authorization: Bearer {token}

---

## 🔵 ADDITIONAL TASKS

### T1: Validar carteirinha por convênio

**Descrição:**  
Bloquear agendamento quando convênio exige carteirinha e o campo número_carteirinha estiver vazio ou inválido. Adicionar validação tanto no frontend (feedback imediato) quanto no backend (segurança).

**Arquivos a modificar:**
- `frontend/src/app/pages/agenda/agenda.component.ts` - Validar se convenio_id selecionado exige carteirinha
- `frontend/src/app/pages/agenda/agenda.component.html` - Tornar campo carteirinha obrigatório condicionalmente
- `api/consultas/index.ts` - Validar no backend se carteirinha é obrigatória
- `services/consultas.service.ts` - Adicionar lógica de validação cruzada

**Validação:**
- Consultar tabela `convenios` para verificar coluna `exige_carteirinha` (boolean)
- Se true e numero_carteirinha vazio, retornar erro 400

---

### T2: Filtro por profissional em consultas

**Descrição:**  
Adicionar filtro de profissional (dentista) na página de consultas para que gestores visualizem consultas de profissionais específicos. Implementar no componente filtros e aplicar dinâmicamente.

**Arquivos a modificar:**
- `frontend/src/app/pages/consultas/consultas.component.ts` - Armazenar filtro de usuario_id
- `frontend/src/app/components/filtros/filtros.component.ts` - Adicionar dropdown de profissionais
- `frontend/src/app/services/agenda.service.ts` - Adicionar parâmetro opcional `usuario_id` a `listarConsultas()`
- `api/consultas/index.ts` - Aceitar query param `usuario_id` e filtrar

**Query param:**
```
GET /api/consultas?usuario_id=uuid
```

---

### T3: Busca de paciente por código na agenda

**Descrição:**  
Priorizar busca por `codigo_paciente` no modal de seleção de paciente da agenda. Permitir que digitando o código (P00001) apareça o paciente primeiro. Melhorar UX.

**Arquivos a modificar:**
- `frontend/src/app/pages/agenda/agenda.component.ts` - Modal de busca de paciente
- `frontend/src/app/pages/agenda/agenda.component.html` - Input de busca com hint "Código ou Nome"
- `frontend/src/app/services/agenda.service.ts` - Adicionar `buscarPacientes(termo): Observable<any>` com filtro por LIKE codigo_paciente ou nome
- `api/pacientes/index.ts` - Adicionar query param `busca` ou `termo`

**Query param:**
```
GET /api/pacientes?termo=P00001
GET /api/pacientes?termo=João
```

---

### T4: Tratamento de sessão expirada

**Descrição:**  
Padronizar redirecionamento para login quando API retornar 401 (token expirado). Implementar interceptor global que capture 401 e redirecione, mostrando toast de aviso.

**Arquivos a modificar:**
- `frontend/src/app/services/auth.service.ts` - Adicionar método `logout()` que limpa localStorage/sessionStorage
- `frontend/src/app/interceptors/bearer-token.interceptor.ts` - Capturar status 401 e redirecionar
- `frontend/src/app/guards/auth.guard.ts` - Validar token antes de ativar rota
- Todos os services HTTP - Garantir que herdam do interceptor

**Interceptor Behavior:**
```typescript
// Se response.status === 401
1. Limpar tokens/cache
2. Redirecionar para /login
3. Mostrar toast: "Sua sessão expirou. Faça login novamente."
```

---

### T5: Padrão único de erro na API

**Descrição:**  
Unificar formato de resposta de erro em todos os endpoints. Definir estrutura padrão com código, mensagem e detalhes. Centralizar em arquivo de tipos.

**Arquivos a modificar:**
- `api/_lib/types.ts` - Adicionar interface padrão:
```typescript
interface ApiError {
  erro: "InvalidInput" | "Unauthorized" | "Forbidden" | "NotFound" | "ServerError";
  mensagem: string;
  detalhes?: Record<string, string>;
}
```
- `api/*/index.ts` - Garantir que todos os erros seguem o padrão
- Criar função helper `responderErro(status, tipo, mensagem, detalhes?)`

---

### T6: Testes de erro em páginas críticas

**Descrição:**  
Adicionar cobertura de testes para falhas de API, validação de formulário e estados de loading nas páginas críticas.

**Arquivos a modificar:**
- `frontend/src/app/pages/agenda/agenda.component.spec.ts` - Testes para erro 400/500 ao criar consulta
- `frontend/src/app/pages/pacientes/pacientes.component.spec.ts` - Testes para erro ao listar
- `frontend/src/app/pages/minha-conta/minha-conta.component.spec.ts` - Testes para validação de senha

**Cobertura:**
- ✅ API retorna erro 500
- ✅ API retorna erro 401
- ✅ Formulário inválido bloqueia submit
- ✅ Loading spinner aparece durante requisição
- ✅ Mensagem de erro exibida ao usuário

---

### T7: Testes da API para CRUD completo

**Descrição:**  
Adicionar testes unitários para todos os endpoints CRUD (POST, PUT, DELETE) cobrindo fluxos de sucesso e rejeição por perfil.

**Arquivos a modificar:**
- `api/consultas/index.test.ts` - Testes POST/PUT/DELETE com admin, dentista, recepcionista
- `api/procedimentos-realizados/index.test.ts` - Testes POST com validação de permissão
- `api/convenios/index.test.ts` - Testes CRUD com validação

**Cobertura:**
- ✅ Admin pode CRUD qualquer coisa
- ✅ Dentista pode CRUD apenas suas próprias consultas
- ✅ Recepcionista não pode DELETE
- ✅ Dados inválidos retornam 400
- ✅ Registros não encontrados retornam 404

---

### T8: Revisão final de documentação

**Descrição:**  
Atualizar arquivos README com exemplos reais de APIs funcionando (sem mock), rotas implementadas e fluxos completados.

**Arquivos a modificar:**
- `Readme.md` - Atualizar status do projeto
- `api/README.md` - Listar endpoints implementados com exemplos curl
- `frontend/README.md` - Descrever componentes integrados
- `database/README.md` - Diagrama final das 9 tabelas
- `docs/relatorioParcial.md` - Marcar features completadas

---

### T9: Integração da agenda com Google Calendar

**Descrição:**  
Sincronizar consultas agendadas com Google Calendar. Ao criar/atualizar/cancelar consulta, sincronizar evento no Google Calendar do profissional.

**Arquivos a criar:**
- `api/integracoes/google-calendar/index.ts` - Handler para sincronização
- `api/integracoes/google-calendar/service.ts` - Lógica de integração com Google API

**Arquivos a modificar:**
- `services/consultas.service.ts` - Chamar função de sincronização após criar/atualizar/cancelar
- `frontend/src/app/pages/agenda/agenda.component.ts` - Adicionar aviso "Sincronizando com Google..."

**Requisitos:**
- Credenciais Google Calendar armazenadas em .env
- Validação de escopo de autenticação
- Retry automático se falhar

---

### T10: Disparo de mensagens no WhatsApp

**Descrição:**  
Enviar mensagens WhatsApp para pacientes com `whatsapp_push = true`. Confirmar agendamento ao criar, lembrete 1 dia antes, confirmação após realização.

**Arquivos a criar:**
- `api/integracoes/whatsapp/index.ts` - Handler para envio
- `api/integracoes/whatsapp/templates.ts` - Templates de mensagens

**Arquivos a modificar:**
- `services/consultas.service.ts` - Chamar função de WhatsApp após ações
- `services/logsAcessos.service.ts` - Registrar tentativas de envio

**Requisitos:**
- API WhatsApp (Twilio ou similar) com credenciais em .env
- Template de mensagem com variáveis (paciente, data, horário)
- Log de sucesso/falha em banco de dados

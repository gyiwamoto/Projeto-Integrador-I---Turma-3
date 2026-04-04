# RELATÓRIO PARCIAL — PROJETO INTEGRADOR I

## 1. Identificação e Escopo Geral

**Instituição:** Universidade Virtual do Estado de São Paulo (UNIVESP)  
**Disciplina:** Projeto Integrador I  
**Turma:** 3  
**Projeto:** Sistema de Gestão Odontológica — Dentista Organizado  
**Data de referência do relatório:** 03 de abril de 2026  
**Versão do projeto:** 1.0.0

---

## 2. Apresentação e Justificativa

Este relatório parcial documenta o progresso alcançado na primeira etapa de desenvolvimento do projeto "%DENTISTA ORGANIZADO", um sistema de informação web destinado a apoiar a operação rotineira de consultórios odontológicos. O sistema foi concebido para solucionar necessidades críticas identificadas no contexto de gestão clínica, incluindo a autenticação e controle de acesso de usuários, manutenção centralizada de dados de pacientes, organização de agendas de atendimento, gerenciamento de convênios e procedimentos, além de fornecimento de indicadores gerenciais iniciais. 

O escopo abordado nesta fase concentra-se na implementação das funcionalidades essenciais de negócio, na consolidação de uma arquitetura técnica sólida e na garantia de qualidade do código através de testes automatizados e procedimentos de deploy padronizados.

## 3. Metodologia e Processo de Design

O processo de desenvolvimento adotou uma abordagem iterativa fundamentada em princípios de design thinking, visando alinhar continuamente a solução às necessidades reais do contexto de uso. Esse método apresenta-se organizado em cinco etapas sucessivas:

**3.1 Fase de Empatia:** Realizou-se o levantamento de requisitos funcionais junto ao contexto de uso anticipated, considerando-se as necessidades de agilidade no atendimento, centralização de dados de pacientes, priorização de acesso por perfil de usuário e otimização do fluxo de trabalho.

**3.2 Fase de Definição:** A partir dos insumos coletados, consolidou-se o problema central que o sistema deveria resolver: a fragmentação de informações clínicas, a necessidade de autenticação segura, a redução de retrabalho em cadastros repetidos e a organização hierárquica de dados em um fluxo único e integrado.

**3.3 Fase de Ideação:** Procedeu-se à definição arquitetural das páginas, dos componentes de interface e das jornadas principais do sistema, priorizando-se o fluxo de autenticação, visualização gerencial (dashboard), organização de horários (agenda) e manutenção de dados transversais (pacientes, convênios, tratamentos, usuários).

**3.4 Fase de Prototipação:** Implementou-se as telas em Angular com base em componentes reutilizáveis, gerenciamento reativo de formulários, modais de ação, filtros dinamicamente construídos e tabelas padronizadas para exibição de registros.

**3.5 Fase de Testes e Refinamento:** Validaram-se os comportamentos funcionais das páginas, realizaram-se ajustes de usabilidade, corrigiram-se instabilidades em testes frágeis e consolidou-se a consistência dos dados exibidos em interface.

Essa metodologia orientou a sequência de entrega das funcionalidades e assegurou o alinhamento contínuo do sistema com os fluxos de trabalho antecipados do usuário final.

## 4. Escopo Implementado — Etapa Atual

### 4.1 Camada de Apresentação (Frontend)

Foram implementadas as paginas abaixo, cada uma com objetivo e logica de funcionamento definidos para cobrir o fluxo principal do sistema:

- Login: autenticar o usuario por email e senha. A tela utiliza formulario reativo, valida os campos antes do envio e, em caso de sucesso, direciona o usuario para o dashboard.
- Dashboard: apresentar uma visao geral da operacao da clinica. A pagina exibe indicadores, graficos e proximos atendimentos, com selecao de periodo e elementos de ocultacao de dados sensiveis.
- Agenda: organizar horarios e disponibilidade de atendimento. A logica combina visualizacao por semana ou mes, selecao de profissional, consulta de pacientes e controle de slots livres ou ocupados.
- Consultas: consolidar o historico de consultas em formato tabular. A pagina cruza consultas e pacientes, aplica filtros por data e paciente, e normaliza os dados para facilitar a leitura.
- Pacientes: cadastrar, editar, filtrar e excluir pacientes. A tela usa modal de formulario, filtros por busca e convenio, validacoes de formulario e integracao com a lista de pacientes e convenios.
- Convenios: administrar convenios ativos e inativos. A pagina permite criar e editar registros em modal, aplicar filtros por nome e status e atualizar a listagem apos cada operacao.
- Tratamentos: gerenciar tratamentos e procedimentos. A logica segue o mesmo padrao de tabela com filtros e modal de cadastro, incluindo valor, descricao e status.
- Usuarios: controlar usuarios do sistema por perfil de acesso. A pagina diferencia administradores dos demais perfis, permite criacao, edicao e exclusao com regras de validacao e restricao por permissao.
- Minha Conta: permitir que o usuario altere seus dados e, quando necessario, sua senha. A tela valida os campos, confirma a senha atual antes da alteracao e carrega os agendamentos associados ao perfil.

Tambem foram consolidados componentes reutilizaveis:

- Filtros
- Modal
- Sidebar
- Tabela
- Toast Container
- Agenda Calendario

Do ponto de vista arquitetural, o frontend foi organizado em componentes e paginas independentes, com reuso de elementos de interface para evitar duplicacao de codigo e padronizar a experiencia de uso. Os modais concentram formularios de criacao e edicao, as tabelas padronizam a exibicao de registros e os filtros reduzem a necessidade de codificacao repetida em cada pagina.

### 4.1.1 Estrutura em monorepo

O projeto foi organizado em formato monorepo, reunindo frontend, backend, banco de dados e documentacao no mesmo repositorio. Essa estrutura facilita sincronizacao entre camadas, versionamento unico e reproducao do ambiente local e de producao com os mesmos arquivos de configuracao.

Na pratica, a separacao ficou distribuida da seguinte forma:

- `frontend/`: aplicacao Angular responsavel pela interface do usuario.
- `api/`: funcoes serverless da Vercel responsaveis pela camada HTTP.
- `services/`: regras de negocio compartilhadas entre os endpoints da API.
- `database/`: migrations SQL, scripts de manutencao e rotinas de atualizacao do banco.
- `docs/`: documentacao tecnica, relatorios e orientacoes do projeto.

### 4.1.2 Separação por services

A camada de services foi usada para concentrar regras de negocio e operacoes repetidas fora dos handlers HTTP. Isso inclui autenticacao, logs de acesso, validacao de senha e rotinas de reutilizacao entre rotas. Com isso, os endpoints ficaram mais enxutos e focados apenas em receber a requisicao, chamar o service correspondente e devolver a resposta.

Esse modelo facilita manutencao porque a mesma regra pode ser reaproveitada por diferentes rotas sem duplicacao. Exemplos de uso incluem autenticar o usuario, registrar logs de sucesso ou falha e aplicar verificacoes de permissao antes de operacoes sensiveis.

### 4.1.3 Reuso de componentes

O frontend foi construido com componentes reutilizaveis para manter consistencia visual e reduzir retrabalho. Entre os principais, estao filtros, modal, tabela, sidebar, toast container e o calendario de agenda.

Esses componentes sao combinados nas paginas conforme a necessidade: tabelas exibem listas de registros, filtros refinam a busca, modais concentram formularios de cadastro e notificacoes informam sucesso ou erro ao usuario. Essa abordagem deixa o codigo mais organizado e facilita a evolucao de novas telas com o mesmo padrao de interface.

### 4.2 Camada de Negócio e Integração (Backend — Funções Serverless)

Foram implementadas funcoes serverless para os principais modulos:

- Autenticacao (`/api/auth`)
- Usuarios (`/api/usuarios`)
- Pacientes (`/api/pacientes`)
- Convenios (`/api/convenios`)
- Consultas (`/api/consultas`)
- Tratamentos (`/api/tratamentos`)
- Procedimentos realizados (`/api/procedimentos-realizados`)

O backend ja possui controle de sessao e validacao de autorizacao por perfil.

### 4.3 Camada de Persistência (Banco de Dados — PostgreSQL)

Foi estruturado banco PostgreSQL com migrations versionadas (`001` a `009`) cobrindo:

- usuarios
- pacientes
- convenios
- tratamentos
- consultas
- procedimentos_realizados
- logs_acessos

Foi implementada regra de geracao automatica de codigo de paciente no banco, evitando dependencia de geracao manual no frontend.

## 5. Garantia de Qualidade e Cobertura de Testes

### 4.1 Testes automatizados

Foram criados e/ou estabilizados testes funcionais para componentes e paginas Angular.

Resultado validado em 2026-04-03:

- 19 arquivos de teste
- 205 testes passando

Comando utilizado:

```bash
cd frontend
npm test -- --watch=false
```

Os testes foram tratados como parte do fluxo de desenvolvimento, validando comportamento de pagina, formularios, estados condicionais, navegacao e interacoes do usuario. A estrategia priorizou testes de comportamento em vez de verificacoes visuais fragis, o que aumentou a confiabilidade da suite.

No backend, tambem foram mantidos testes para as rotas e para os services de autenticacao, com foco em login, sessao, logout, permissao e retorno de respostas esperadas em casos de erro.

### 4.2 Melhorias recentes de qualidade

- Correcao de testes instaveis em componentes criticos.
- Padronizacao de testes com foco funcional (comportamento e regras), reduzindo verificacoes visuais fragis.
- Inclusao de testes para todas as paginas principais do frontend.

## 6. Esteira de Integração e Deployment

A esteira de deployment foi configurada para a plataforma Vercel, com definição de instruções de build, instalação de dependências, construção de artefatos e publicação sincronizada de frontend e backend. O arquivo de configuração `vercel.json` na raiz do repositório define o comportamento esperado durante o processo de build: instalação separada de dependências para frontend (`./frontend`) e API (`./api`), compilação da aplicação Angular com output em `frontend/dist/dentista-organizado/browser`, e exposição explícita das rotas serverless em `/api`.

A arquitetura garante que o frontend seja publicado como artefato estático servido por CDN, enquanto a camada de API permanece como funções independentes executadas sob demanda (cold start). O arquivo `vercel.json` define também o runtime explícito das funções (`@vercel/node@5.1.4`), eliminando ambiguidades quanto à versão do interpretador e reduzindo riscos de incompatibilidade.

Variáveis de ambiente obrigatórias para produção incluem `DATABASE_URL` (conexão com banco de dados PostgreSQL) e `JWT_SECRET` (chave para assinatura de tokens JWT). Essas credenciais devem ser configuradas nos settings do projeto Vercel e não devem ser versionadas no repositório.

## 7. Artefatos Entregues e Avanços Alcançados

A presente etapa resultou na entrega dos seguintes artefatos funcionais:

- **Fluxo completo de autenticação:** Implementação end-to-end de login, validação de sessão, logout e controle de acesso baseado em perfil (admin, dentista, recepcionista).
- **CRUDs principais:** Operações de criação, leitura, atualização e exclusão para entidades centrais (pacientes, convênios, tratamentos) com validações, filtros e confirmação de ações sensíveis.
- **Agenda com múltiplos modos de visualização:** Visualização por semana ou mês, seleção de profissional, consulta de disponibilidade de pacientes e controle de slots livres e ocupados.
- **Dashboard gerencial:** Apresentação inicial de indicadores (consultas do dia, pacientes ativos, procedimentos mais realizados, análise de faturamento por período) com estrutura preparada para integração de dados reais.
- **Documentação técnica estruturada:** READMEs por módulo (frontend, api, database), changelog versionado, e especificação de fluxos de execução local.
- **Suite de testes automatizados:** 205 testes funcionais cobrindo componentes, páginas e serviços backend com foco em comportamento e validação de fluxos críticos.

## 8. Desafios Identificados e Estratégias de Mitigação

### 8.1 Desafios Técnicos

Durante o processo de desenvolvimento, foram identificados os seguintes desafios:

**Estabilidade em testes automatizados:** Os testes unitários de componentes Angular apresentaram fragility devido a ciclos de detecção de mudanças (change detection) em efeitos colaterais de dependências, resultando em flaky tests que prejudicavam a confiabilidade da suite.

**Divergência entre modelo de dados local e contratobackend:** A ausência de integração imediata com a API levou à permanência de dados mockados no frontend, criando riscos de desalinhamento entre estruturas de dados esperadas e estruturas reais retornadas pelo backend.

**Complexidade na orquestração do ambiente monorepo:** A configuração local de um ambiente que executasse sincronamente frontend (Angular), API (Vercel functions) e migrations de banco exigiu refinement nos scripts de setup e documentação de execução.

### 8.2 Estratégias de Solução Aplicadas

As seguintes estratégias foram implementadas para mitigação dos desafios:

- **Refatoração de testes com foco em comportamento:** Migrou-se de testes visuais frágeis para testes funcionais centrados em verificação de regras de negócio, navegação de formulários e validações de permissão, reduzindo a dependência de timing e change detection.
- **Normalização de contratos de dados:** Realizou-se revisão sistemática das interfaces de payload entre frontend e backend, consolidando-se nomes de campos, tipos de dados e estruturas de resposta em um modelo único.
- **Documentação e automação de setup:** Atualizaram-se READMEs com instruções passo a passo para instalação em monorepo, incluindo scripts de inicialização de banco de dados, migrações e servidor de desenvolvimento.

## 9. Retroalimentação (Feedback) da Comunidade

### 9.1 Mecanismos de Coleta
A retroalimentação foi coletada através de:
- Avaliações de código em pull requests dentro da plataforma GitHub.
- Discussões assíncronas registradas em documentos compartilhados.
- Testes de usabilidade informais com usuários antecipados (professores orientadores e colegas de projeto).

### 9.2 Síntese de Percepções e Sugestões

**Aspecto Positivo:** A comunidade reconheceu positivamente a clareza das interfaces de formulário, a padronização visual através de componentes reutilizáveis e a documentação técnica acessível.

**Sugestões de Melhoria:** 
- Ampliar a cobertura de testes para cenários de erro (edge cases) e fluxos ponta-a-ponta (end-to-end).
- Integrar indicadores gerenciais do dashboard com dados reais provenientes da API.
- Aprimorar a experiência de agendamento com notificações em tempo real e sincronização automática de slots.
- Documentar fluxos de data governance e compliance de proteção de dados (LGPD/GDPR).

**Críticas Construtivas:**
- A dependência de dados mockados no frontend retarda a validação de contratos reais com o backend.
- A documentação sobre variáveis de ambiente em produção poderia ser mais explícita quanto a valores de timeout e limites de conexão.

### 9.3 Aprendizados Gerados

As interações com a comunidade de desenvolvimento geraram os seguintes aprendizados, que orientarão as próximas etapas:

1. **Importância da integração contínua:** Feedback mostrou que manter dados mockados por mais tempo que o necessário gera silos de conhecimento e atrasa descoberta de problemas de integração.
2. **Relevância de testes de integração:** A comunidade enfatizou que testes unitários, embora necessários, são insuficientes para validar comportamentos críticos de fluxos de negócio envolvendo múltiplas camadas.
3. **Clareza nas convenções de desenvolvimento:** Padronizações explícitas (como nomenclatura de serviços, estrutura de pastas, padrões de erro) facilitam onboarding de novos colaboradores e reduzem tempo de code review.
4. **Valor da documentação viva:** Documentações que evoluem junto com o código (READMEs, diagrama de arquitetura) mantêm a comunidade alinhada e reduzem ambiguidades.

## 10. Plano de Próximas Etapas

Com base nos aprendizados e retroalimentação coletada, o plano para a próxima fase de desenvolvimento inclui:

1. **Completar integração frontend-backend:** Substituir dados mockados por consumo real da API em todas as páginas, validando contratos de requisição/resposta e tratando cenários de erro de rede.
2. **Expandir cobertura de testes:** Implementar testes de integração ponta-a-ponta (e2e) para fluxos críticos (login → agenda → logout), testes de carga para validar comportamento sob stress, e cenários de erro para todas as rotas esperadas.
3. **Consolidar indicadores gerenciais:** Integrar dados reais do backend no dashboard, implementar cálculos de faturamento em tempo real, e adicionar exportação de relatórios em PDF/CSV.
4. **Evoluir governança de deploy:** Implementar pipeline de CI/CD com testes automáticos pré-deploy, monitoring de performance em produção, logging centralizado de erros, e alertas para falhas críticas.
5. **Preparar para entrega final:** Documentar fluxos de conformidade (LGPD), preparar guias de operação e manutenção, e validar segurança através de testes de penetração.

---

## 11. Conclusão Parcial

O projeto "Dentista Organizado" encontra-se em estado funcional quanto ao seu escopo principal, com arquitetura técnica consolidada para evolução contínua. Esta etapa inicial demonstrou progresso consistente em três dimensões: implementação de funcionalidades de negócio, qualidade do código através de testes automatizados, e documentação estruturada que sustenta manutenção futura.

A retroalimentação coletada junto à comunidade de desenvolvimento evidenciou tanto validação de boas práticas adotadas (componentização, padronização visual, documentação técnica) quanto áreas de melhoria (integração completa, testes de integração, governança de deploy). Os aprendizados gerados nesta fase fornecerão orientação objetiva para o refinamento das etapas subsequentes, com foco em consolidação de integração ponta-a-ponta, ampliação de cobertura de testes e preparação de procedimentos operacionais para uso em produção.

As próximas iterações devem priorizar a eliminação de dependências de dados mockados, a validação de cenários de erro e a implementação de mecanismos de observabilidade e suporte às operações em produção, visando culminar na entrega final de um sistema operacionalmente maduro para a disciplina.

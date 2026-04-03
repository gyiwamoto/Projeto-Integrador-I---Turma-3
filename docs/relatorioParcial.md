# Relatorio Parcial - Projeto Integrador I

## 1. Identificacao

- Instituicao: UNIVESP
- Disciplina: Projeto Integrador I
- Turma: Turma 3
- Projeto: Dentista Organizado
- Data de referencia deste relatorio: 2026-04-03
- Versao do projeto: 1.0.0

## 2. Objetivo do projeto

Desenvolver um sistema web para apoio a rotina de um consultorio odontologico, cobrindo autenticacao, controle de usuarios, cadastro de pacientes, agenda de consultas, convenios, tratamentos e visualizacao gerencial inicial.

## 3. Escopo implementado ate o momento

### 3.1 Frontend

Foram implementadas as paginas:

- Login
- Dashboard
- Agenda
- Consultas
- Pacientes
- Convenios
- Tratamentos
- Usuarios
- Minha Conta

Tambem foram consolidados componentes reutilizaveis:

- Filtros
- Modal
- Sidebar
- Tabela
- Toast Container
- Agenda Calendario

### 3.2 Backend (API)

Foram implementadas funcoes serverless para os principais modulos:

- Autenticacao (`/api/auth`)
- Usuarios (`/api/usuarios`)
- Pacientes (`/api/pacientes`)
- Convenios (`/api/convenios`)
- Consultas (`/api/consultas`)
- Tratamentos (`/api/tratamentos`)
- Procedimentos realizados (`/api/procedimentos-realizados`)

O backend ja possui controle de sessao e validacao de autorizacao por perfil.

### 3.3 Banco de dados

Foi estruturado banco PostgreSQL com migrations versionadas (`001` a `009`) cobrindo:

- usuarios
- pacientes
- convenios
- tratamentos
- consultas
- procedimentos_realizados
- logs_acessos

Foi implementada regra de geracao automatica de codigo de paciente no banco, evitando dependencia de geracao manual no frontend.

## 4. Qualidade e testes

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

### 4.2 Melhorias recentes de qualidade

- Correcao de testes instaveis em componentes criticos.
- Padronizacao de testes com foco funcional (comportamento e regras), reduzindo verificacoes visuais fragis.
- Inclusao de testes para todas as paginas principais do frontend.

## 5. Entregas parciais relevantes

- Fluxo completo de autenticacao no frontend e backend.
- CRUD principal de pacientes, convenios e tratamentos.
- Agenda com selecao de data/profissional e fluxo de agendamento local.
- Dashboard com indicadores e estrutura para evolucao de dados reais.
- Documentacao tecnica atualizada (READMEs por modulo e changelog).

## 6. Dificuldades encontradas e tratativas

- Ajustes de estabilidade em testes de componentes Angular devido a ciclos de deteccao de mudanca.
- Alinhamento entre dados mockados no frontend e contratos reais do backend.
- Refino de setup local em ambiente monorepo (frontend + API + migrations).

Tratativas aplicadas:

- Refatoracao de testes para cenarios funcionais.
- Revisao de contratos e normalizacao de payloads.
- Atualizacao da documentacao de execucao local e scripts.

## 7. Proximas etapas

- Concluir integracoes ainda dependentes de dados mockados.
- Expandir cobertura de testes para cenarios de erro e integracao ponta a ponta.
- Consolidar relatorios e indicadores com dados reais do backend.
- Evoluir governanca de deploy e observabilidade para etapa final.

## 8. Conclusao parcial

O projeto encontra-se funcional em seu escopo principal e com base tecnica consolidada para evolucao. A etapa atual demonstra progresso consistente em implementacao, qualidade de codigo e documentacao. As proximas iteracoes estao direcionadas para fechar integracoes pendentes, ampliar testes de fluxo completo e preparar o sistema para entrega final da disciplina.

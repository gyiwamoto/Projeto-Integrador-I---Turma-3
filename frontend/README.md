# Frontend - Dentista Organizado

Aplicacao Angular do projeto, com autenticacao, dashboard e modulos clinicos.

## Status atual

- Versao: `1.0.0`
- Paginas implementadas: dashboard, login, agenda, consultas, pacientes, convenios, tratamentos, usuarios e minha conta.
- Componentes reutilizaveis com testes funcionais: filtros, modal, sidebar, tabela, toast-container e agenda-calendario.
- Resultado da ultima execucao de testes: `205 passed (205)` em `2026-04-03`.

## Requisitos

- Node.js 22.x
- npm 10.x

## Scripts

- `npm run start`: inicia o Angular sem proxy.
- `npm run start:proxy`: inicia o Angular com proxy para a API local.
- `npm run build`: build de producao.
- `npm run watch`: build em modo watch.
- `npm run test`: executa testes.

## Escopo de testes funcionais

Atualmente existem testes funcionais para:

- Componentes compartilhados
- Guards e servicos principais
- Todas as paginas em `src/app/pages/*`

Comando recomendado para CI/local:

```bash
npm test -- --watch=false
```

## Desenvolvimento local

Executando apenas o frontend:

```bash
npm install
npm run start:proxy -- --port 4200
```

Com isso, chamadas para `/api/*` sao encaminhadas para `http://localhost:3000` por meio de `proxy.conf.json`.

## Notas funcionais recentes

- Tela de pacientes alinhada ao schema do banco (`pacientes`):
  - `codigo_paciente` e exibido como somente leitura e gerado no backend.
  - formulario envia apenas campos aceitos pelo backend (`nome`, `data_nascimento`, `telefone`, `whatsapp_push`, `email`, `convenio_id`, `numero_carteirinha`).
- Tela Minha Conta passou a exibir "Meus agendamentos" para `dentista` e `admin`.

## Fluxo recomendado (workspace)

Na raiz do repositorio:

```bash
npm run install-all
npm run dev
```

Esse fluxo sobe frontend e API em paralelo com as portas padrao do projeto.

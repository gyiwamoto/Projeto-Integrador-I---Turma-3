# Frontend - Dentista Organizado

Aplicacao Angular do projeto, com autenticacao, dashboard e modulos clinicos.

## Requisitos

- Node.js 22.x
- npm 10.x

## Scripts

- `npm run start`: inicia o Angular sem proxy.
- `npm run start:proxy`: inicia o Angular com proxy para a API local.
- `npm run build`: build de producao.
- `npm run watch`: build em modo watch.
- `npm run test`: executa testes.

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

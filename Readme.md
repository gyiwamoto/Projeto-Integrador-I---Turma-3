# Dentista Organizado

Sistema de gerenciamento de consultório odontológico desenvolvido como Projeto Integrador I — UNIVESP, Turma 3, Grupo 3.

## Tecnologias

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Frontend     | Angular 21 + TypeScript + SCSS       |
| Backend      | Node.js + Vercel Serverless Functions |
| Banco de dados | PostgreSQL                          |
| Deploy       | Vercel                              |
| Controle de versão | GitHub                        |

## Estrutura do repositório

```
/
├── api/          # Vercel Serverless Functions (rotas do backend)
├── frontend/     # Aplicação Angular
├── database/     # Migrações SQL
├── docs/         # Documentação do projeto
└── vercel.json   # Configuração de build e roteamento
```

## Como executar localmente

### Pré-requisitos

- Node.js >= 24
- npm >= 10

### Frontend

```bash
cd frontend
npm install
npm start
```

Acesse `http://localhost:4200`.

### Backend (Vercel Functions)

```bash
npm install -g vercel
vercel dev
```

As funções ficam disponíveis em `http://localhost:3000/api/*`.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com base no `.env.example`:

```env
DATABASE_URL=
JWT_SECRET=
```

## Equipe

Projeto Integrador I — UNIVESP | Turma 3 | Grupo 3

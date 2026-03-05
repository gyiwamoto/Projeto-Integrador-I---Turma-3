# Fluxo de Git – Projeto Sistema de Consultório

Este documento define o fluxo de versionamento utilizado no projeto para facilitar a colaboração entre os 7 membros da equipe.

## Estrutura de Branches

O projeto utiliza três tipos principais de branches:

- `main`
- `develop`
- `feat/*`

### main
Branch de **produção**.

Características:
- Contém apenas código estável.
- Toda versão considerada pronta deve ser mergeada aqui.
- Deploy automático na Vercel ocorre a partir desta branch.

Exemplo:

main → produção (Vercel)

---

### develop
Branch de **integração do time**.

Características:
- Recebe as features finalizadas.
- Serve para testes antes de enviar para produção.
- Pode gerar um deploy de preview na Vercel.

Fluxo:

feat/* → Pull Request → develop

---

### feat/*
Branches de **desenvolvimento de funcionalidades específicas**.

Cada funcionalidade deve ser criada em uma branch própria.

Padrão de nomenclatura:

feat/nome-da-feature

Exemplos:

feat/login  
feat/cadastro-paciente  
feat/historico-consultas  
feat/integracao-google-agenda  

Fluxo:

develop → criar branch → desenvolver → Pull Request → develop

---

## Fluxo de Trabalho

### 1. Atualizar o repositório

Antes de começar uma nova tarefa:

```bash
git checkout develop
git pull origin develop

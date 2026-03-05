# Fluxo de Git - Projeto Sistema de Consultorio

Este documento define o fluxo de versionamento utilizado no projeto para facilitar a colaboracao entre os membros da equipe.

## Estrutura de Branches

O projeto utiliza tres tipos principais de branches:

- `main`
- `develop`
- `feat/*`

### main

Branch de **producao**.

Caracteristicas:

- Contem apenas codigo estavel.
- Toda versao considerada pronta deve ser mergeada aqui.
- Deploy automatico na Vercel ocorre a partir desta branch.

Fluxo:

`develop` -> Pull Request -> `main`

---

### develop

Branch de **integracao do time**.

Caracteristicas:

- Recebe as features finalizadas.
- Serve para testes antes de enviar para producao.
- Pode gerar um deploy de preview na Vercel.

Fluxo:

`feat/*` -> Pull Request -> `develop`

---

### feat/*

Branches de **desenvolvimento de funcionalidades especificas**.

Cada funcionalidade deve ser criada em uma branch propria.

Padrao de nomenclatura:

`feat/nome-da-feature`

Exemplos:

- `feat/login`
- `feat/cadastro-cliente`
- `feat/historico`

Fluxo:

`develop` -> criar branch -> desenvolver -> Pull Request -> `develop`

---

## Fluxo de Trabalho

### 1. Atualizar a base local

Antes de comecar uma nova tarefa:

```bash
git checkout develop
git pull origin develop
```

### 2. Criar a branch da feature

Crie a branch a partir da `develop` atualizada:

```bash
git checkout -b feat/nome-da-feature
```

### 3. Desenvolver e versionar localmente

Durante o desenvolvimento:

```bash
git add .
git commit -m "feat: descricao curta da funcionalidade"
```

Exemplos de prefixo de commit:

- `feat`: nova funcionalidade
- `fix`: correcao de bug
- `docs`: alteracao em documentacao
- `refactor`: melhoria interna sem mudar comportamento externo
- `test`: criacao ou ajuste de testes

### 4. Publicar a branch no remoto

```bash
git push -u origin feat/nome-da-feature
```

### 5. Abrir Pull Request para `develop`

Ao terminar a feature:

- Abrir PR de `feat/*` para `develop`.
- Descrever o que foi alterado.
- Referenciar issue/tarefa relacionada.
- Solicitar revisao de pelo menos 1 integrante.

### 6. Revisao e merge em `develop`

Criterios minimos para merge:

- Build sem erros.
- Sem conflitos pendentes.
- Revisao aprovada.
- Escopo da PR coerente com a descricao.

Apos aprovacao, fazer merge da PR em `develop`.

### 7. Validar integracao em `develop`

Depois do merge:

- Validar fluxos principais no ambiente de preview.
- Corrigir regressao em nova `feat/*` (nao commitar direto em `develop`).

### 8. Preparar release para `main`

Quando `develop` estiver estavel:

- Abrir PR de `develop` para `main`.
- Realizar revisao final.
- Confirmar que o conjunto esta pronto para producao.

### 9. Merge em `main` e publicacao

Depois da aprovacao:

- Fazer merge em `main`.
- Confirmar deploy da Vercel.
- Criar tag de versao (ex.: `v0.3.0`) conforme `docs/versionamento.md`.

Exemplo de tag:

```bash
git checkout main
git pull origin main
git tag v0.3.0
git push origin v0.3.0
```

### 10. Sincronizar branches apos release

Para manter o historico alinhado:

```bash
git checkout develop
git pull origin develop
```

Se necessario, atualizar branches locais de trabalho tambem:

```bash
git checkout feat/outra-feature
git rebase develop
```

## Fluxo de Correcao Urgente (Hotfix)

Para incidentes em producao:

1. Criar branch de correcao a partir de `main`: `fix/nome-do-hotfix`.
2. Aplicar correcao e abrir PR para `main`.
3. Apos merge em `main`, abrir PR de sincronizacao para `develop`.

Comandos base:

```bash
git checkout main
git pull origin main
git checkout -b fix/nome-do-hotfix
```

## Resumo Rapido

Fluxo padrao:

`develop` -> `feat/*` -> PR para `develop` -> validacao -> PR para `main` -> deploy

Regra principal:

- Nao commitar direto em `main`.
- Nao commitar direto em `develop`.
- Toda alteracao entra por Pull Request.

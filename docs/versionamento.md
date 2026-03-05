## Versionamento

Além do fluxo de branches (`feat/*`, `develop`, `main`), usamos **versionamento** para identificar entregas do sistema.

> Este projeto está saindo do zero. Então, no início, **não faz sentido ficar alterando `MAJOR` a todo momento**.

### Versão final (estável) — `vMAJOR.MINOR.PATCH`

Adotamos o padrão **SemVer** (Versionamento Semântico):

- **MAJOR**: mudanças grandes ou que podem quebrar compatibilidade.
- **MINOR**: novas funcionalidades mantendo compatibilidade.
- **PATCH**: correções de bugs e ajustes pequenos.

Exemplos: `v1.0.0`, `v1.2.0`, `v1.2.3`

A **versão final** é a que consideramos pronta/estável e associada ao que está em `main` (produção).

### Regra para projeto no início (fase `0.x`)

Enquanto o sistema ainda estiver em construção e sem compromisso de estabilidade pública, usamos:

- **`v0.MINOR.PATCH`** como padrão.
- **`MAJOR` fica em `0`** (não sobe para `1`, `2`, `3` sem um marco real).
- **`MINOR`** sobe para novas funcionalidades e entregas relevantes.
- **`PATCH`** sobe para correção de bugs e ajustes pequenos.

Exemplos esperados nesta fase: `v0.1.0`, `v0.2.0`, `v0.2.1`

Quando subir para `v1.0.0`?

- Quando houver um marco claro de estabilidade do produto (acordado pelo time).
- Quando a equipe decidir que a base está pronta para ser tratada como primeira versão estável.

### RC (Release Candidate) — pré-versão para validação

**RC** significa *Release Candidate* (“candidata a release”): é uma **pré-versão** gerada para testes e validação antes de virar uma versão final.

- Uma RC já deve estar “quase pronta”, mas ainda pode receber correções.
- RCs existem para que o time valide (testes, QA, homologação) **sem** chamar aquilo de release final.

Formato sugerido (SemVer com sufixo):
- `v0.3.0-rc.1`
- `v0.3.0-rc.2`

Regra prática:
- Se for necessário corrigir algo durante a validação, incrementa o número: `rc.1` → `rc.2` → `rc.3`…

### Onde cada tipo de versão deve aparecer

- `feat/*`: **somente RCs** (ex.: `v0.3.0-rc.1`) durante o desenvolvimento e validação da feature.
- `develop`: **somente RCs** (ex.: `v0.3.0-rc.4`), consolidando o que será a próxima entrega.
- `main`: **somente versões finais** (ex.: `v0.3.0`), após aprovação do RC.

### Regra rápida para não inflar `MAJOR`

- Projeto ainda em fase inicial? Mantém `MAJOR = 0`.
- Teve nova funcionalidade? Sobe `MINOR`.
- Foi apenas correção/ajuste? Sobe `PATCH`.
- Só suba `MAJOR` (`1.0.0`, `2.0.0`...) com decisão de marco estável ou quebra de compatibilidade relevante em versões estáveis.

### Limites de `MINOR` e `PATCH` (padrão interno)

O SemVer não define teto numérico para `MINOR` e `PATCH`, mas para manter versões legíveis adotamos este limite interno:

- `PATCH`: `0` a `99`
- `MINOR`: `0` a `99`

Regras de virada (rollover):

- Ao chegar em `PATCH = 99`, a próxima correção vira novo `MINOR` e zera `PATCH`.
- Ao chegar em `MINOR = 99`, a próxima evolução **abre decisão de `MAJOR` pelo time**; se aprovado, vira novo `MAJOR` e zera `MINOR` e `PATCH`.

Exemplos:

- `1.4.99` + correção -> `1.5.0`
- `1.99.8` + nova funcionalidade -> `2.0.0`

Assim evitamos versões como `1.0.10000` e mantemos o histórico organizado.

### Fluxo resumido do versionamento

1. Implementa em `feat/*` → gera/atualiza RCs conforme necessário.
2. Integra em `develop` → continua em RC até estabilizar.
3. Quando aprovado: merge em `main` e cria a **versão final** (remove o sufixo `-rc.N`):
   - `v0.3.0-rc.4` → `v0.3.0`
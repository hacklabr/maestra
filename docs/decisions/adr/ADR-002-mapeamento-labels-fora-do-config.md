# ADR-002 — Mapeamento de labels/colunas persiste em `.maestra/labels.md`, fora do `config.md`

**Status:** Current
**Date:** 2026-08-06
**Round:** R12

## Context

A rota de setup (J12, issue #44) precisa persistir a convenção de labels de
estágio (stage-1/2/3) e de colunas do board (not-started, in-progress,
in-review, delivered) confirmada pelo humano — uma vez por repositório,
versionada, editável à mão.

O candidato óbvio era `.maestra/config.md`. Mas o parser real
(`src/platform/config.ts`, ADR-014) aceita **somente** as chaves `platform`,
`host`, `project` e `board`; qualquer chave fora do padrão é **silenciosamente
ignorada** (documentado em `templates/config.md`: "drift here = invisible
configuration"). Persistir o mapeamento lá produziria configuração invisível —
o pior dos mundos: o arquivo diria uma coisa, o código leria nada.

## Decision

O mapeamento de labels/colunas vive em **`.maestra/labels.md`** (template em
`src/instructions/templates/labels.md`), arquivo próprio, versionado no
repositório, nascido na J12 STAGE 1 e re-mapeável por invocação parcial
("reconfigura as labels") ou edição manual.

O parser de `config.md` **não é estendido** nesta round: a J12 é uma round de
instruções, e a convenção não precisa de leitura programática hoje — quem
consome o mapeamento é o facilitador (instrução), não o código. Se uma tool
futura precisar ler o mapeamento deterministicamente, a extensão do parser (ou
um leitor de `labels.md`) entra como round própria, com reclassificação
registrada.

## Consequences

- **Positiva:** zero mudança em `src/` na R12; nenhuma configuração invisível;
  um arquivo, um lugar, para a convenção de nomes.
- **Positiva:** a separação reforça a distinção do P5/P6 — `config.md` é fato
  de ambiente detectado; `labels.md` é convenção confirmada pelo humano; o
  board real continua sendo a fonte de verdade sobre colunas (P6: em
  divergência, o board vence e o arquivo é corrigido no ato).
- **Custo:** dois arquivos de configuração em `.maestra/` em vez de um —
  mitigado pelo template declarar a razão da separação no próprio cabeçalho.
- **Risco:** facilitador gravar o mapeamento no `config.md` por hábito —
  mitigado pela J12 e pelo template nomearem a restrição do parser
  explicitamente.

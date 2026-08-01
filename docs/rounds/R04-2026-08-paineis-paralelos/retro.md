# Retrospective — R04 (painéis paralelos)

## What went well

- Variante Minimal + process work (exceção da Role rule 4) funcionou para uma
  mudança de instrução: o facilitador editou diretamente, sem delegar a
  especialista, e o fluxo foi direto (scope → executar → reconciliar).
- O spawn contract existente (shell subagent + marker + G-08 persistence)
  absorveu os três modos sem mudança estrutural — apenas parametrização.
- `check:vocab` e `check:dist` passaram sem ajuste; 848 testes verdes.

## Process signals

- **Dois locais de instrução:** as instruções do plugin existem tanto em
  `src/instructions/` (fonte do repo, compilada para `dist/`) quanto em
  `~/.config/opencode/maestra/instructions/` (instalada). Editei a instalada
  primeiro (onde o facilitador lê em runtime), depois precisei aplicar as
  mesmas edições na fonte do repo. Isso é atrito ergonômico — candidato a
  finding (`ergonomic-friction`).
- **`docs/referencia/jornadas.md` inexistente:** vários arquivos de instrução
  (incluindo o próprio J9) citam `docs/referencia/jornadas.md` como Source,
  mas esse arquivo não existe neste repo. O `maestra_status` já reporta
  `referenceDocs: false`. Isso é uma doc-contradiction (trigger #16) — a
  referência normativa citada não existe. Candidato a issue `doc-bug`.

## Inverted health metrics check

- Overrides nesta round: 1 (Technical → Minimal, registrado na triagem).
- Deviações: 0 during, 0 at-reconciliation.
- `doc-bug`: 0 (mas o sinal do `jornadas.md` inexistente foi identificado —
  pendente virar issue).

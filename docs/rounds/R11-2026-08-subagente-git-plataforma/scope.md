# Scope of round R11 — Subagente especializado em git + CLI de plataforma

> Epic: [#40](https://github.com/hacklabr/maestra/issues/40) · Variant: Minimal (modo direto)
> Briefing: a própria issue #40 (Minimal — a issue é o briefing), aprovado em sessão direta em 2026-08-05.

## Variant

minimal

## Requirements introduced

- RF-23 — O fluxo roteia as operações mecânicas de git e de CLI de plataforma (`git`, `gh`/`glab`) para um subagente especializado, com contrato de retorno destilado: a sessão principal recebe apenas o resultado (sucesso destilado ou erro final); tentativas, retries e saídas de erro ficam confinados ao subagente.
- RF-24 — O especialista existe como instrução de agente dedicada no repositório (precedente: `issue-writer-kernel.md`, R06), instalável pelo `install.sh`.

## Requirements changed

(nenhum)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Mudanças na adapter layer (`src/adapter.ts`, ADR-010) ou nas ferramentas `maestra_*` — a round é de instrução/persona, não de código de produto.
- Painéis J9 e o shell `maestra/specialist` (reservado a personas de painel).
- Suporte a operações via MCP.

## Acceptance criteria (do briefing aprovado)

1. Existe no repo uma instrução/persona de especialista em operações git+plataforma, instalável pelo `install.sh`.
2. Kernel/jornadas relevantes roteiam a mecânica de git+CLI para esse especialista, com contrato de retorno destilado explícito (retries dentro do subagente; sessão principal recebe só o resultado).
3. `npm run ci` verde, incluindo `check:vocab` (vocabulário neutro de plataforma preservado).

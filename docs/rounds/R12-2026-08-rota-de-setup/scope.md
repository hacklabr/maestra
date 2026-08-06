# Scope of round R12 — Rota de setup no kernel

> Epic: [#44](https://github.com/hacklabr/maestra/issues/44) · Variant: Minimal (modo direto)
> Briefing: a própria issue #44 (Minimal — a issue é o briefing), aprovado em sessão direta em 2026-08-06.

## Variant

minimal

## Requirements introduced

- RF-25 — O kernel (standard e direct) tem porta de entrada "setup" no roteador: intenção de setup/configuração do projeto roteia para uma jornada dedicada (`j12-setup`), em vez de ser engolida pela triagem J1 ou pela captura J11.
- RF-26 — A jornada de setup pergunta ao humano o mapeamento de labels de estágio (stage-1/2/3) e, por plataforma, das colunas do board (GitHub: opções do campo Status do Projects v2; GitLab: labels `status::*` para not-started, in-progress, in-review, delivered), persiste o mapeamento em `.maestra/labels.md` (arquivo novo, template próprio — o parser de `config.md` ignora chaves fora das 4 de ADR-014) e cria as labels inexistentes via `create-label` dos cookbooks (idempotente).
- RF-27 — A jornada de setup cria a estrutura `docs/reference/` (PRD vivo, jornadas, arquitetura, `decisions/` para ADRs) e, em projeto com código pré-existente, produz a documentação inicial (PRD, ADRs) delegando a especialistas via `task`.
- RF-28 — A jornada de setup analisa as issues abertas e propõe agrupamento em épicos; nenhuma reorganização é aplicada sem confirmação explícita do humano.

## Requirements changed

(nenhum)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Mudanças em `src/` (parser de `config.md`, tools `maestra_*`) — a round é de instruções/cookbooks/templates; se o desenho exigir código, reclassificar com registro.
- Alterar o comportamento das jornadas J1–J11 além do ponto de roteamento (J1 STAGE 4 mantém o que faz; a sobreposição com a rota nova é decisão de desenho registrada no comentário técnico).
- Aplicação automática da reorganização do board (a jornada propõe; o humano decide; execução em rounds futuras).

## Acceptance criteria (do briefing aprovado)

1. Existe porta de entrada "setup" no roteador do kernel (standard e direct), com módulo de jornada próprio.
2. A jornada pergunta ao humano as labels de estágio (stage-1/2/3) e, por plataforma, o mapeamento de colunas (GitHub Projects v2 × GitLab `status::*`), persistindo o mapeamento (`.maestra/labels.md`).
3. Labels nomeadas inexistentes são criadas na plataforma (via `create-label` idempotente dos cookbooks).
4. A jornada cria `docs/reference/` e subpastas no repositório-alvo.
5. Em projeto com código pré-existente, a jornada produz PRD e ADRs iniciais.
6. A jornada analisa as issues abertas e propõe agrupamento em épicos (sugestão confirmável pelo humano, nunca aplicada sem confirmação).
7. Sub-capacidades (re-mapear labels, reorganizar board) são invocáveis isoladamente, sem rodar o setup completo.

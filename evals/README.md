# Eval harness — plugin fluxo

Condição vinculante do projeto (spec D7): **harness ou sem-dogfood**. O plugin
é ~20% código determinístico e ~80% comportamento em instructions — esta é a
única verificação da maioria dos 16 itens anti-bypass.

## Arquitetura (3 tiers)

| Tier | O quê | Onde roda |
|---|---|---|
| **1 — determinístico** | ordem de tool-calls, contagem de perguntas, regexes P3/P4, hard-fails #2/#3/#13, estrutura da recusa | PR gate (todo PR) |
| **2 — LLM-as-judge** | rubrica versionada (`lib/rubric.md`), binário por item | nightly |
| **3 — golden transcripts** | diff ESTRUTURAL (nunca byte) com baseline revisada por humano | sob demanda / mudança de instructions |

O **provider custom** (`providers/fluxo-agent.mjs`) dirige o loop do agente com
**tools stubadas determinísticas** (`lib/stub-tools.mjs`): `fluxo_status`,
`fluxo_issue_digest` e `fluxo_emit_event` respondem de fixtures; `bash` roteia
por regex para saídas gravadas (mutações têm sucesso genérico gravado; leituras
sem rota falham com 127 — fixture bug, nunca dado silencioso); `read`/`write`
operam num fs virtual do fixture de repo. O transcript completo volta como JSON
e os asserts o inspecionam.

## Rodando

```bash
npm run eval:dry       # mock model — prova o pipeline SEM modelo vivo (verde agora)
npm run eval           # PR gate: tier-1, bateria core, cache ON  (modelo vivo)
npm run eval:nightly   # matriz completa + judge, --no-cache      (modelo vivo)
npm run eval:golden    # diff estrutural dos golden transcripts    (modelo vivo)
npm test               # inclui o self-test do harness (evals/__tests__)
```

Modelo vivo (qualquer endpoint OpenAI-compatível):

```bash
export FLUXO_EVAL_MODEL=gpt-4o-mini
export FLUXO_EVAL_BASE_URL=https://api.openai.com/v1
export FLUXO_EVAL_API_KEY=...
```

Temperatura fixa em 0. **Flaky eval = bug**: quarentena em 24h com issue
linkada; nunca retry para mascarar regressão de instructions.

## A bateria dos 16 anti-bypass (mapeamento)

| # | Item | Cenário | Guarda principal |
|---|---|---|---|
| 1 | Sycophancy na triagem | AB-01 (Tiago) | ordem override→mutação + evidência |
| 2 | Nunca rascunhar resposta | AB-02 + J8 (Débora, 5 variantes) | forbiddenPatterns |
| 3 | Trava de aprovação | AB-03 (Paula) | hard-fail `approval-lock` |
| 4 | Critérios+fora de escopo 100% | AB-04 | resistência + override |
| 5 | Tarefa executável sem perguntas | AB-05 | requiredPatterns (template) |
| 6 | Derivação verificada | AB-06 + J2 (B1–B6) | digest primeiro; resumo falseável |
| 7 | Devolutiva nunca absorvida | AB-07 | requiredPatterns devolutiva |
| 8 | Caracterização+baseline | AB-08 | forbiddenPatterns |
| 9 | Worktree 100% | AB-09 | hard-fail `worktree` |
| 10 | Veredito por critério | AB-10 | requiredPatterns |
| 11 | Métricas invertidas | AB-11 (+ `fluxo-report` — fora de runtime) | requiredPatterns |
| 12 | Disfarce refatoração↔feature | AB-12 | requiredPatterns |
| 13 | Reconciliação = gate | AB-13 | hard-fail `close-entregue` |
| 14 | Desvio vago rejeitado | AB-14 (+ hook desvios.md, unit) | requiredPatterns em files |
| 15 | Evidência executada | AB-15 | hard-fail `evidence-before-verdict` |
| 16 | Contradição → bug-documentacao | AB-16 | ordem + label |

Cenários adicionais: `j1-triagem.yaml` (calibração: ≤3/turno, ≤5 total, ≤3
Mínima, regra de ouro do PO, dedup, **Completa Q2 + fatia do funil com onda
P7**), `j2-retomada.yaml` (B1–B6), `j8-guarda.yaml` (recusa com 5 princípios;
arcos Débora/Tiago/Paula), `fm-vinculantes.yaml` (**FM-04, FM-06, FM-12,
FM-21** — escopo vinculante do dogfood #1, Guardian V-4 + lado de eval da
V-2; FM-13 é coberto pelo fluxo-report + J2 B6), `j9-mesa-shell.yaml`
(**SH-01..05** — arquitetura shell-specialist: spawn sem marcador fail-closed,
declaração de persona ausente/divergente, uma sessão = uma persona
(adversarial), resume sem re-injeção, isolamento por mesa; o gate de
roteamento do ask_peer em si é unit test em `src/__tests__/ask-peer.test.ts`).

Asserts estruturais além da bateria: `two-layer-issues.mjs` (corpos de issue
em duas camadas P1 — critério de aceite #8) e a regra hard-fail
`assignee-after-confirmation` (criação com assignee só após a confirmação
consolidada P7 — critério de aceite #9), ambos com testes unitários no
self-test do harness.

Contrato do adaptador: `src/platform/__tests__/contract.test.ts` — suíte
ÚNICA rodada contra as duas implementações (paridade por construção; os
arquivos gêmeos ficam só com os gotchas de cada plataforma).

## Regras do corpus

- **Todo fracasso real de dogfood vira fixture + cenário** (colheita contínua).
- Fixtures são factory-built (`*.json` em `fixtures/`); failure fixtures são
  first-class.
- Cenário novo para gap não decidido (G-xx) = requisito pendente linkado,
  nunca teste skipped sem issue.
- Rubrica do judge é versionada neste repositório (`lib/rubric.md`) com
  changelog; judge pinado, temperatura 0.
- Baselines golden NUNCA são aceitas automaticamente — revisão humana
  obrigatória (`--update` manual).

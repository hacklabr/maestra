# Scope of round R19 — Dedup universal antes de criar issue

> Epic: [#53](https://github.com/hacklabr/maestra/issues/53) · Variant: Minimal (modo direto)
> Briefing: a própria issue #53 (Minimal — a issue é o briefing), aprovado em sessão direta em 2026-08-28.
> Nota: pastas R16–R18 pré-existentes (sessões paralelas ativas; R18 com worktree aberto) forçaram Rnn = 19 — colisão verificada na re-lista antes do nascimento; a metadata da #53 nasceu "Round: R16" e foi corrigida para R19 no ato.
> Relacionada (não duplicata): [#34](https://github.com/hacklabr/maestra/issues/34) / R16 — melhoria da classificação das issues criadas; complementar a este gate.

## Variant

minimal

## Requirements introduced

- RF-54 — **Gate universal de dedup na criação**: antes de criar qualquer issue que representa uma demanda (épico, doc-bug, task de desvio, revert-demand, promoção de stage-0), o facilitador busca issues relacionadas e possíveis duplicatas — abertas E fechadas — no repositório da sessão. Candidato encontrado → apresentado ao humano ANTES da criação, com as opções create new / relate / increment (reuso do padrão já existente em J1 Stage 5 Step 0 e J11 — mecânica e microcopy, nada inventado do zero). Nada encontrado → prossegue sem atrito adicional. Issues relacionadas não-duplicatas entram como cross-reference no corpo da issue criada.
- RF-55 — **Filhas de onda confirmada (P7) nascem sem busca individual**: a dedup da demanda (feita no nível do épico/plano) cobre a onda inteira; a regra "dedup do plano" fica documentada nas instruções para não gerar ruído mecânico contra tasks homônimas de rounds passados.
- RF-56 — **Operação `search-similar` documentada nos cookbooks** GitHub e GitLab (vocabulário neutro plataforma), com retorno destilado: ≤3 candidatos (nº + título) ou "nada encontrado" — nunca a listagem completa. Mecânica de busca delegável ao `maestra/ops` quando instalado (padrão J11 v5).
- RF-57 — **Evals pinam o gate universal**: cenário(s) que falham se a criação de issue fora de J1/J11 acontecer sem busca prévia (extensão do cenário de dedup já existente em `evals/scenarios/j1-triage.yaml`).

## Requirements changed

(nenhum)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Ferramenta de dedup semântica/automática — o matching usa a busca textual existente (`gh search issues` / `glab`); insuficiência comprovada em uso vira demanda futura.
- Mudanças no fluxo de captura do J11 (já tem dedup obrigatório — apenas referenciado, não alterado).
- Limpeza do `docs/dogfooding/findings.md` corrompido (F023/F024 repetidos — demanda separada).
- Busca em outros repositórios/boards da organização (escopo: repositório da sessão corrente).
- Tratamento de duplicatas históricas já existentes no backlog (só o gate novo; o passivo é assunto de #34).

## Acceptance criteria (do briefing aprovado)

1. Toda criação de issue que representa uma demanda (épico, doc-bug, task de desvio, revert-demand, promoção de stage-0) é precedida de uma busca visível na sessão (abertas + fechadas), em toda jornada que cria issue — não só J1 e J11.
2. Com candidato encontrado, o humano vê o candidato (nº + título) e escolhe create new / relate / increment ANTES da issue existir — em qualquer jornada.
3. Filhas de onda confirmada nascem sem busca individual; a regra "dedup do plano" está documentada nas instruções.
4. Os cookbooks GitHub e GitLab documentam a operação `search-similar` com retorno destilado (≤3 candidatos ou "nada encontrado").
5. Há cenário de eval que piniona o gate universal e falha quando a criação acontece sem busca prévia.

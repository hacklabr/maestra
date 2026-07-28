# Template — Definition of Ready (resumo para consulta rápida)

> Source: fluxo-de-desenvolvimento.md §11.7 (+ §6 gate de saída da Etapa 1) · Module version: 1 — 2026-07-28
> Anti-drift: verbatim da fonte. Na persona Etapa 1 (PO), "DoR" é termo proibido (P4) — falar "o pacote que precisa estar pronto pra Engenharia começar".

## Checklist do gate da Etapa 1 (fluxo §6 — verificação item a item)

- [ ] Briefing da rodada (problema, contexto, métricas de sucesso, restrições)
- [ ] PRD de referência atualizado com requisitos identificados (RF/RNF)
- [ ] Regras de negócio documentadas
- [ ] Fora de escopo explícito
- [ ] Jornadas + user stories com critérios de aceite
- [ ] Escopo da rodada definido (`escopo.md` com os RFs/RNFs da rodada)
- [ ] **Parecer de viabilidade preliminar:** ao menos uma pessoa da Etapa 2 participou da validação

## Tabela de obrigatoriedade por variante (fluxo §11.7)

| Artefato | Obrigatório? |
|---|---|
| Briefing da rodada (registro) | Sim (variante Completa; mini-briefing na Condensada) |
| PRD de referência atualizado com RF/RNF | Sim (Completa/Condensada; issue na Mínima) — **por rodada** |
| Fora de escopo explícito | **Sim — sempre** |
| Critérios de aceite | **Sim — sempre, em todas as variantes** |
| Jornadas de referência | Completa: sim; Condensada: só as afetadas |
| Escopo da rodada (`escopo.md`) | Sim |
| Parecer de viabilidade da Etapa 2 | Sim |
| Protótipo/wireframes | Se houver UI |

**Regras de aplicação:**
- Nas variantes Condensada e Mínima o pacote se reduz proporcionalmente (matriz 3.5) — **mas critérios de aceite e fora de escopo nunca saem** (anti-bypass #4: bloqueante, 100%).
- **Gate cumprido = todas as tarefas de artefato da Etapa 1 fechadas** — verificadas uma a uma (nunca inferência). Tarefa de artefato fechada cujo artefato não existe no repositório **não conta**.
- O parecer de viabilidade é assíncrono por natureza: atribuir + comentar marcando a pessoa da Etapa 2 + encerrar o turno graciosamente — nunca segurar o humano esperando nem simular o parecer.
- Tentativa de pular o gate → override P3 com defesa escalonada (microcopy §7.1/§7.4).

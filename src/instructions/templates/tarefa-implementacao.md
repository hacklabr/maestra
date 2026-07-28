# Template — Tarefa de implementação — Etapa 3

> Source: fluxo-de-desenvolvimento.md §11.1 + docs/referencia/jornadas.md §5 P1 (v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: seções verbatim da fonte §11.1 dentro da estrutura de duas camadas (P1). A camada humana (Resumo) é obrigatória mesmo na Etapa 3 — o épico e o board são lidos por não técnicos.
> Plataforma-neutro (ADR-012): "PR/MR" na 1ª ocorrência.

```markdown
{TÍTULO — máx. ~60 caracteres, verbo + objeto, linguagem de negócio}

## Resumo
<!-- 2–4 frases: o que esta tarefa entrega e por quê, em linguagem que um
     não técnico entende. O entregável é código + testes via PR/MR. -->

**Variante:** {completo | condensado | minimo | tecnica} · **Etapa atual:** 3 · **Subestado:** em-execucao · **Épico:** #{N} · **Rodada:** {Rnn}

---
## Detalhes para execução

### Contexto
<!-- De onde veio esta tarefa? -->

### Épico
<!-- Link da issue-mãe — obrigatório -->

### Variante do fluxo
<!-- completo | condensado | minimo | tecnica -->

### Requisitos atendidos
<!-- Ex.: RF-03, RNF-01 — obrigatório; na variante Técnica, linkar o documento de motivação -->

### Referências
<!-- Link para a seção do documento de referência e do ADR relevantes
     (docs/referencia/, docs/decisoes/adr/) -->

### O que fazer
<!-- Descrição objetiva da implementação.
     Teste de qualidade (fluxo §7): executável SEM PERGUNTAS — releia como um
     dev externo que não participou da conversa; se você teria uma pergunta,
     a tarefa volta. Fronteiras declaradas: arquivos/módulos que esta tarefa
     toca (paralelização sem conflito — critério #7 do briefing). -->

### Fora de escopo desta tarefa
<!-- O que explicitamente NÃO deve ser feito aqui -->

### Critérios de aceite
<!-- Copiados/derivados do PRD vivo — a tarefa só fecha com eles validados,
     com veredito explícito por critério (atendido/não atendido).
     Na variante Técnica: (a) paridade de comportamento + (b) meta de melhoria -->
- [ ] ...
```

**Regras de uso:**
- Toda tarefa referencia ≥1 RF/RNF; todo RF/RNF do `escopo.md` da rodada tem ≥1 tarefa (gate da Etapa 2).
- PR/MR com escopo inflado além do "O que fazer" = scope creep — o agente nomeia.
- Worktree declarado no início de cada implementação (anti-bypass #9).

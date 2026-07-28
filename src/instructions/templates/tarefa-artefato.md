# Template — Tarefa de artefato — Etapas 1 e 2

> Source: fluxo-de-desenvolvimento.md §11.2 + docs/referencia/jornadas.md §4–§5 (v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: seções verbatim da fonte §11.2 dentro da estrutura de duas camadas (P1). O campo "Tipo e local de entrega" é a declaração de classe documental — obrigatória em toda tarefa de artefato (governança REFERÊNCIA × REGISTRO).

```markdown
{TÍTULO — máx. ~60 caracteres, verbo + objeto, linguagem de negócio}

## Resumo
<!-- 2–4 frases: qual documento esta tarefa produz/atualiza e por quê,
     em linguagem que um não técnico entende. -->

**Variante:** {completo | condensado | minimo | tecnica} · **Etapa atual:** {1|2} · **Subestado:** em-artefatos · **Épico:** #{N} · **Rodada:** {Rnn}

---
## Detalhes para execução

### Épico
<!-- Link da issue-mãe — obrigatório -->

### Artefato a produzir
<!-- Ex.: mini-briefing, atualização do PRD de referência, ADR,
     análise de fit, motivação, baseline, escopo da rodada -->

### Tipo e local de entrega
<!-- OBRIGATÓRIO — a classe documental do artefato:
     REFERÊNCIA (docs/referencia/ — vivo, editado no lugar)
     ou REGISTRO (docs/rodadas/Rnn-aaaa-mm-nome/, docs/decisoes/adr/ —
     datado, imutável após o fechamento da rodada).
     Ex.: atualizar docs/referencia/prd.md — seção X -->

### Insumos necessários
<!-- Documentos ou decisões dos quais este artefato depende -->

### Critérios de aceite
<!-- Itens da Definition of Ready / gate da etapa que este artefato
     precisa satisfazer. A tarefa só fecha com eles validados. -->
- [ ] Artefato commitado no local correto do repositório
- [ ] ...
```

**Regras de uso:**
- A pasta da rodada **nasce no primeiro commit de artefato da rodada** — nunca na triagem — e nasce SEMPRE, em todas as variantes (decisão Q1).
- Tarefa de artefato fechada cujo artefato declarado **não existe no repositório não conta para o gate** (J2 — microcopy §7.2, "artefato não encontrado").
- Documento de referência: editado **no lugar**, versão única — nunca cópia versionada (`prd-v2.md` é proibido). Documento de registro: no máximo adendo datado após o fechamento.

# Template — Issue em duas camadas (P1)

> Source: docs/referencia/jornadas.md §5 P1 (+ P1.1), v2.1 · Module version: 1 — 2026-07-28
> Anti-drift: camada humana imutável em espírito (nunca reescrita — só corrigida/adicionada); camada de execução livre. A fronteira `## Detalhes para execução` tem nome FIXO.
> Plataforma-neutro (ADR-012): "issue" = issue/ticket da plataforma detectada.

```markdown
{TÍTULO — máx. ~60 caracteres, verbo + objeto, linguagem de negócio}

## Resumo
<!-- 2–4 frases: o quê, para quem, por quê. Zero jargão técnico.
     Escrito com as palavras do autor da demanda (o facilitador parafraseia,
     não inventa). NUNCA reescrito depois — só corrigido ou acrescentado. -->

**Variante:** {Completa|Condensada|Mínima|Técnica} · **Etapa atual:** {1|2|3} · **Subestado:** {ver P1.1 — vocabulário fechado} · **Épico:** #{N} · **Rodada:** {Rnn}

---
## Detalhes para execução
<!-- Camada de agente. Tudo abaixo da linha é escrito para devs e agentes
     de IA — preciso, referenciado, sem ambiguidade. -->

### Contexto e origem
<!-- De onde veio esta tarefa/demanda? -->

### Requisitos atendidos
<!-- Ex.: RF-03, RNF-01 — obrigatório; na variante Técnica, linkar o documento de motivação -->

### Referências
<!-- Links: seção do documento de referência (docs/referencia/) e ADRs relevantes -->

### O que fazer
<!-- Descrição objetiva -->

### Fora de escopo desta tarefa
<!-- O que explicitamente NÃO deve ser feito aqui -->

### Critérios de aceite
<!-- Em linguagem testável por humano — a ponte das duas camadas.
     Ex.: "o relatório exportado abre no Excel sem quebrar acentos",
     NÃO "validar encoding UTF-8 no stream".
     Na variante Técnica: (a) paridade de comportamento + (b) meta de melhoria.
     A tarefa só fecha com veredito explícito por critério. -->
- [ ] ...
```

**Regras de atualização:**
- A linha de metadados é atualizada a cada transição (variante, etapa, subestado, rodada) — no mesmo ato de qualquer override (atomicidade P3).
- `Subestado` usa apenas os valores de P1.1 (`triagem`, `em-artefatos`, `aguardando-parecer`, `aguardando-aprovacao-e1`, `aguardando-decisao-devolutiva`, `em-execucao`, `pausada`, `aguardando-reconciliacao`, `fechada-reconciliada`). `fechada-sem-reconciliacao` nunca é escrito — é derivado (J2, branch B6).
- Comentários posteriores (decisões, devolutivas, overrides) seguem o mesmo padrão: frase humana primeiro, detalhe técnico depois.

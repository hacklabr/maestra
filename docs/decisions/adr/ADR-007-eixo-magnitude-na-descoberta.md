# ADR-007 — Eixo de magnitude na descoberta: magnitude ≠ variante, gatilho por porta de entrada

**Status:** Current
**Date:** 2026-09-02
**Round:** R22

## Contexto

Briefings de demandas nascidas em texto livre (a porta de entrada mais carente de contexto) têm saído rasos e o raso se paga como retrabalho na implementação (F048). O Maestra já tem o eixo de **variante** (peso do processo: Minimal/Condensed/Full/Technical), mas nada governava a **profundidade da descoberta** — que ficava à deriva do facilitador, independente da variante. F048 mostrou o custo: demandas nascidas em texto livre, sem nenhum contexto, produziam briefings rasos; o raso se paga como retrabalho na implementação. A porta texto-livre é a que mais precisa de profundidade porque é a que menos contexto carrega (sem corpo de issue, sem histórico).

O plugin Mesa oferece um método de descoberta estruturado (Briefing-Writer: classificação de magnitude, âncoras, coverage map). Referência considerada nesta decisão (consultada e rejeitada a opção de copiar): o Briefing-Writer **proíbe** leitura de codebase; o Maestra **deriva do repo** por princípio — nunca perguntar ao humano o que o repo responde. Os dois modelos são incompatíveis na fonte de informação, então a opção de vendorizar/importar o prompt foi descartada.

## Decisão

1. **Magnitude é um eixo distinto de variante.** Variante = peso do processo (Minimal/Condensed/Full/Technical); magnitude = profundidade da descoberta (SIMPLE/COMPOSITE). Uma demanda Minimal pode ser COMPOSITE-magnitude e vice-versa. A magnitude é classificada na descoberta (J3) quando a porta de entrada é texto livre; variante continua intacta no J1 (esta round não mexeu na classificação de variante).
2. **Gatilho: porta de entrada.** Deep mode só dispara quando a demanda nasce em texto livre (o epic carrega `Born from: free text` na camada de execução — as demais portas seguem a conduta atual até que a extensão seja avaliada (out-of-scope desta round: J11 e stage-0).
3. **Derivação > confirmação > pergunta** preservado como hierarquia — o único ponto de divergência do Mesa que se rejeita é a proibição de ler o codebase.
4. **Cobertura map não vira motor de iteração:** máximo 1 rodada de aprofundamento por briefing; depois, aprovação ou corte de escopo.

## Consequências

- **Positiva:** briefing raso de demanda texto-livre deixa de ser invisível (coverage map expõe profundidade) e de ser o caminho padrão (magnitude obrigatória) — o erro deixa de ser silencioso.
- **Custo:** eixo extra para aprender (magnitude ≠ variante); 5 perguntas extras para demandas compostas (aceito: custo assimétrico — rascar composto é irreversível a jusante).
- **Risco:** coverage map virar motor de iteração (anti-padrão conhecido: máx. 1 rodada, registrado no fluxo (R22) e coberto pela regra de "never an iteration engine".
- **Superfície compartilhada:** `reference/microcopy.md` com R20 (round paralela, mesma data) — merge coordination necessária (instruções tocam o mesmo arquivo; coordenação de merge registrada no design da round.

## Referências

- Issue #59 (epic R22) · `docs/rounds/R22-2026-09-descoberta-texto-livre/scope.md` · finding F048

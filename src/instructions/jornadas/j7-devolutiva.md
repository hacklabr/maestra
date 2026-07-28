# J7 — Devolutiva (Caminho de Volta)

> Source: docs/referencia/jornadas.md v2.1 (§6 J7) + fluxo-de-desenvolvimento.md §7 (devolutiva), §9.3 · Module version: 1 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 — versão inicial (T9): formalização antes da conversa, decisão com registro duplo, retomada por re-derivação, absorção nomeada.

**Gatilhos:** parecer negativo (J4) · descoberta invalidante (J5/J8) · paridade impossível ou violada (J6/J5 Etapa 5). **Enquadramento:** a devolutiva é a jornada que o fluxo trata como SUCESSO — é o processo funcionando, melhor agora do que na entrega. Microcopy §7.10 (devolutiva 2→1) dá o tom.

## ETAPA 1 — Formalização da objeção

Documente a objeção **antes de qualquer conversa informal** — comentário no épico (camada humana P1: frase humana primeiro, detalhe depois) com:

- a objeção e a **evidência** (o que foi encontrado, onde);
- o **custo das alternativas** (cortar / pagar / adiar — o que cada uma implica).

Registro primeiro, conversa depois — nunca o inverso. Atualize `Subestado: aguardando-decisao-devolutiva` na linha de metadados. Se uma tarefa em andamento depende da decisão, ela **pausa**: subestado `pausada` + comentário nomeando o que desbloqueia; o cartão permanece em `Em andamento` (P1.1).

## ETAPA 2 — Decisão da Etapa 1

Apresente as alternativas em **linguagem de produto**: cortar escopo, pagar o custo ou adiar. Quem decide é a Etapa 1 — só ela enxerga prioridade, impacto e custo de oportunidade.

- **"Vamos vendo" NÃO é decisão.** Persistindo a indecisão, nomeie: "sem decisão, a tarefa fica pausada — qual das três?".
- **Registro DUPLO:** a decisão fica registrada **na pasta da rodada** (registro) E, se muda comportamento, é refletida **no PRD vivo na mesma rodada** — os dois, não um.
- Tom: "o processo funcionando" — devolutiva é sucesso do fluxo, não falha de ninguém.

## ETAPA 3 — Retomada

Re-derive o estado (`fluxo_issue_digest`) — nunca assuma que a memória da sessão basta. Atualize:

- tarefas-filhas (escopo cortado → tarefas ajustadas ou fechadas com comentário);
- `escopo.md` da rodada (RFs afetados pela decisão);
- linha de metadados (subestado seguinte) e board.

**Critério de sucesso absoluto: nenhuma tarefa continua executando escopo decidido como cortado.** Verifique uma a uma.

## Falha crítica e métrica invertida

- **Devolutiva absorvida em silêncio** (alguém "resolveu por conta") → nomeada como violação, com empatia (gatilho #7 do kernel): o problema não é a iniciativa, é a invisibilidade — problema escondido na Etapa 2 explode na Etapa 3.
- **Métrica de saúde invertida (gatilho #11):** zero devolutivas em 3 meses = suspeita de absorção, não perfeição. Registre no `retro.md` quando aplicável.

## Critérios de sucesso da jornada

- Objeção registrada antes da conversa informal, com evidência e custo das alternativas.
- Decisão explícita (cortar/pagar/adiar) com registro duplo (rodada + PRD vivo quando muda comportamento).
- Zero tarefa executando escopo cortado após a retomada.

# Retrospectiva — R18 (branch do épico)

> Registro (RECORD) — nasce no fechamento da round. Sinais de fluxo §9.4.

## O que correu bem

- Descoberta resolveu 6 pontos de decisão com 1 pergunta de elicitação (0 no
  total da triagem; evento A limpo) — derivação + confirmação carregaram o
  peso.
- Guarda "sem mudanças em código" segurou: diff final = instruções/docs
  apenas; `check:vocab` verde de primeira.
- Atomicidade board/metadada/PR em todos os atos (criação, execução, PR,
  aceite) — a família F010/F018/F019 não reincidiu.

## Sinais de fluxo (para a próxima triagem)

- **Pressão de namespaces sequenciais sob rounds paralelas** — 3 colisões
  numa única round: número de pasta (R16 ocupada → R18), número de ADR
  (ADR-005 tomada pela R16) e 5 conflitos de changelog no merge (R19). A
  regra "incrementa e re-anuncia" funcionou em todos os casos, mas o custo
  cresce com o paralelismo. Candidato a round futura: numeração derivada
  (ex.: ADR-<ano><seq>?) ou merge serializado por fila. Ver D001/D003.
- **Merge de PR por via local** ("faça o merge local") funciona, mas contorna
  a revisão de PR da plataforma — o fluxo não prescreve essa variante hoje;
  ficou implícito como decisão humana no ato. Registrar expectativa futura.

## Desvios do facilitador

- Escrevi a primeira versão do `deviations.md` com rótulos de campo em PT
  ("Planejado", "Razão") em vez dos rótulos canônicos EN do template — o hook
  rejeitou 2× antes de eu reler o template. Registrado como F044
  (dogfooding): instrução clara, execução do facilitador que deslizou.

## Métricas

- Elicitação: 0 perguntas (triagem) + 1 (descoberta: norma × configurável).
- Overrides: 0. Desvios: 3 (D001–D003), todos declarados no ato.
- Veredicto: 7/7 critérios cumpridos; reconciliação com evidência executada.

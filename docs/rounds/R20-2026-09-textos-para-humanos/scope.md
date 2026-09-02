# Scope of round R20 — Textos que humanos leiam sem esforço

> Epic: [#58](https://github.com/hacklabr/maestra/issues/58) · Variant: Minimal (modo direto)
> Briefing: rascunho apresentado no chat e aprovado em sessão direta em 2026-09-02 (a issue #58 carrega o registro em duas camadas).
> Origem: relato do humano registrado como F047 (`docs/dogfooding/findings.md`) — textos mentalmente custosos, IDs internos sem explicação (F045, R16, gh 2.97), jargão não traduzido (finding, move-card, type=F), frases densas.
> Parente (não duplicata): [#3](https://github.com/hacklabr/maestra/issues/3) / R02 "conversa mais acolhedora" — tratou do **tom** das mensagens para a persona não técnica; esta round trata de **clareza de conteúdo** para qualquer persona, inclusive desenvolvedor. Decisão humana (2026-09-02): nova demanda, épico novo.

## Variant

minimal

## Requirements introduced

- RF-58 — **Referência interna explicada na primeira ocorrência**: toda sigla ou código interno usado em mensagem ao humano (Fnnn do caderno de falhas, Rnn de round, #nn de issue, versão de ferramenta como gh 2.97, campos como type=F) vem acompanhado de uma explicação curta na primeira vez que aparece na mensagem — o suficiente para o leitor não interromper a leitura para decifrar.
- RF-59 — **Inglês apenas quando é o nome da coisa**: termo em inglês não substitui palavra portuguesa natural na conversa com o humano (finding → registro; move-card → mover o card); quando o termo técnico é o nome próprio da coisa no universo do projeto (PR, label, board), é usado com contexto mínimo na primeira ocorrência.
- RF-60 — **Curto sem omitir o relevante**: mensagens ao humano carregam o essencial — o que foi feito, o que isso significa, o que vem depois — em frases diretas; densidade de referências cruzadas não é completude.
- RF-61 — **Vale para toda persona**: as regras de clareza aplicam-se a qualquer interlocutor, inclusive persona técnica (hoje a proteção de vocabulário — P4 — mira só a persona não técnica).
- RF-62 — **Regra verificável, nunca vaga**: as regras novas são escritas como imperativos observáveis (padrão ADR-001 — "seja claro" é proibido; "toda sigla vem com explicação na primeira ocorrência" é a forma).
- RF-63 — **Não-regressão por eval**: cenário de eval que falha quando uma mensagem ao humano usa referência interna sem explicação (extensão do arcabouço de asserts/rubrics já existente — `evals/scenarios/r02-welcoming-language.yaml`, `evals/lib/transcript-asserts.mjs`).

## Requirements changed

(nenhum)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Mensagens de erro das ferramentas do plugin em código (só as instruções de escrita do facilitador).
- Tradução das instruções internas do plugin para o português (convenção do repo: instruções em inglês).
- Limpeza do `docs/dogfooding/findings.md` (entradas duplicadas F023/F024, colisões F040–F042 — demanda separada, nota no F042).
- Reescrita de documentos históricos (rounds passadas, ADRs) — só a escrita nova é governada.

## Acceptance criteria (do briefing aprovado)

1. O exemplo real citado no F047, reescrito sob as novas regras, é compreensível sem conhecimento prévio dos códigos internos — cada referência explicada em poucas palavras.
2. As regras de clareza estão em `microcopy.md` como imperativos verificáveis e aplicáveis a qualquer persona.
3. Existe eval de não-regressão que falha quando uma mensagem ao humano usa código interno sem explicação.
4. As mensagens do facilitador nesta própria round seguem as novas regras (dogfooding imediato).

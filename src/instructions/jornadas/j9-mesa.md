# J9 — Mesa de Discussão Ad-hoc (arquitetura shell-specialist)

> Source: docs/referencia/jornadas.md v2.3 (§6 J9, §7.9; G-08) + decisão humana (shell-specialist) · Module version: 2 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 (T9) — roster curado de 12 personas + W-04. v2 (jornadas v2.3, decisão humana) — **roster eliminado**: UM subagente shell `fluxo/especialista` + marcador `persona::<id>@<mesaId>` expandido pelo hook do plugin a partir do catálogo instalado (`instructions/catalog/`); catálogo INTEIRO invocável; busca por grep/glob nativo (sem tool dedicada, com gatilho de promoção documentado); W-04 deletada (não há mais subconjunto instalado).

**Gatilho:** convocação humana (livre, a qualquer momento) ou sugestão sua (somente quando estas instructions indicarem — decisão com consequência duradoura que toca múltiplos domínios). **Colisão de vocabulário:** a mesa nunca usa "rodada" sozinha — "rodada de discussão" ou "mesa"; os turnos da mesa são "turnos".

## ETAPA 1 — Convocação

**Pauta explícita obrigatória** — mesa sem pauta é o anti-padrão de discussão obrigatória disfarçado. O convite (microcopy §7.9) diz em uma frase: **por que agora, quem, quanto custa** — e **"seguir sem" é sempre opção visível**.

**Seleção de especialistas (receita de busca — catálogo inteiro invocável):**

1. `glob("instructions/catalog/**/*.md")` — o universo de personas instaladas.
2. `grep` pelo domínio da decisão (ex.: `grep -ril "segurança\|security" instructions/catalog/`) — restrinja por diretório de divisão quando óbvio.
3. Leia o **frontmatter** dos 2–3 candidatos principais (nome, descrição, divisão) — nunca o arquivo inteiro nesta etapa.
4. Escolha e inclua no convite pelo nome de domínio legível ("back-end e segurança"), não pelo ID.

Sem tool dedicada de busca: grep/glob nativos bastam. **Gatilho de promoção documentado:** se o dogfood mostrar buscas falhando (domínio correto não encontrado em 1 tentativa de grep, recorrente) ou custo de tokens de listagem perceptível → promover uma tool de busca no catálogo. Decisão por dados, não antecipada.

## ETAPA 2 — Turnos sequenciais (contrato de spawn shell)

**Um especialista por vez.** Cada especialista é UM spawn do subagente shell com UMA persona — o hook do plugin expande a persona do catálogo para dentro da sessão.

**Contrato de spawn (inviolável):**

- `subagent_type="fluxo/especialista"` — sempre o mesmo shell.
- **Primeira linha do prompt:** `persona::<id>@<mesaId>` — o marcador que o hook usa para expandir a persona e registrar a sessão (ex.: `persona::software-development-backend-architect@mesa-cache-relatorio`). Sem o marcador na primeira linha, não há expansão.
- **Resume por turno:** OpenCode → `task_id="mesa-<mesaId>-<personaId>"`; Mimo → capture o session id retornado e reuse como `actor_id`. O mesmo par mesa+persona = a mesma sessão em todos os turnos.
- **UMA SESSÃO = UMA PERSONA, inviolável.** Nova persona = novo spawn. NUNCA peça a uma sessão expandida como X que "agora responda como Y" — isso destrói a contaminação deliberada e a auditabilidade das posições.
- **No resume (turnos seguintes): NÃO re-injete a persona** — ela já está no histórico da sessão. Envie apenas o contexto novo do turno: a pauta (se mudou) e os **paths das posições** registradas desde o último turno deste especialista. File paths, nunca resumos — cada especialista lê as posições anteriores ele mesmo.

**Conteúdo do primeiro turno de cada especialista:** marcador (linha 1) + pauta + contexto da decisão + paths das posições já registradas nesta mesa (se houver).

**Auto-checagem barata:** a primeira resposta de cada especialista começa com a auto-declaração da persona expandida (ex.: "[backend-architect]"). Declaração ausente ou divergente do marcador = expansão falhou — trate como falha de spawn (abaixo).

**Falhas de spawn:**
- **Spawn sem marcador** (ou marcador malformado) → o hook não expande, a sessão NÃO entra no mapa de pares e o `ask_peer` **nega consultas** com aviso (fail-closed: mesa sem expansão registrada não delibera). Respawn corrigindo o marcador — nunca tente "consertar" a sessão em texto.
- **Arquivo de persona inexistente** no catálogo (`instructions/catalog/<id>.md`) → o hook reporta o erro; escolha outro candidato da busca (Etapa 1) ou informe o humano. Nunca improvise a persona você mesmo.

**`ask_peer` entre especialistas:** consultas direcionadas (clarificar, contestar, pedir elaboração). Guards na tool: **busy-check anti-ciclo** (A ocupada aguardando B quando C a consulta), **cap de 3 consultas por par por sessão**, e você (facilitador) **mecanicamente excluído** — para falar com um especialista, delegue outro turno.

**Contrato de persistência por turno (G-08):** a posição de cada especialista é escrita **no fim de cada turno**, não só na síntese — sem isso, "sessão morta → nada se perde" é falso:

- Pasta da rodada existente → `docs/rodadas/Rnn-.../mesa/<mesaId>-<turno>-<personaId>.md` (**REGISTRO auxiliar da rodada**: imutável após escrita; NUNCA deletada quando a síntese vira ADR — a síntese é o documento da decisão, as posições são o registro de quem disse o quê).
- Mesa antes do nascimento da pasta (ex.: durante a triagem) → posições como **comentários no épico** (um por turno, assinados), migrando para a pasta quando ela nascer. Nunca ficam só na sessão.

## ETAPA 3 — Síntese e registro

- **Você sintetiza, sem votação formal** (microcopy §7.9 fechamento): convergências, divergências e o critério de desempate. A palavra final é do humano.
- **Registro no artefato:** decisão técnica → ADR em `docs/decisoes/adr/` com status e rodada. **Se a mesa reverteu decisão anterior, o ADR antigo é marcado `Substituído` no mesmo ato.** O texto da síntese verbal e o do artefato são o mesmo texto.
- Interrupção → retomada pela pauta + posições lidas do repositório/plataforma, sem perguntar "onde estávamos"; síntese parcial registrada "em aberto".

## Critérios de sucesso da jornada

- Pauta em uma frase registrada; zero mesas obrigatórias em pontos fixos; "seguir sem" oferecido.
- Todo especialista spawnado via shell com marcador válido na primeira linha; auto-declaração de persona presente na primeira resposta; uma sessão = uma persona.
- Posição persistida por turno no local correto da classe documental; retomada após sessão morta reconstrói a mesa pelos artefatos.
- Síntese com divergências e desempate registrada no artefato (ADR com status; substituição no mesmo ato).

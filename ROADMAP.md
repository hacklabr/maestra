# Roadmap — fluxo-facilitador

> Tudo que ficou **fora do MVP**, com o **gatilho objetivo** que tira cada item da gaveta e a **origem** da decisão (spec ou consenso de especialistas). Roadmap sem gatilho é onde o feedback morre — nenhum item aqui é "um dia a gente vê".
>
> Referências: especificação (`.mesa/sessions/202607262135_05fe_plugin-fluxo-desenvolvimento/specification.md`, seção "Roadmap" + D1 "Fase 2" + D7) e `docs/referencia/jornadas.md` v2.1.

---

## 1. Fase 2 — itens com gatilho escrito

Itens já analisados e adiados com gatilho definido na especificação. Quando o gatilho dispara, o item entra no próximo ciclo — sem nova discussão de escopo.

| Item | O que é | Gatilho objetivo | Origem |
|---|---|---|---|
| `move_board_card` | Tool dedicada de movimentação de cartão no board (hoje: operação via instructions + CLI, com degradação graciosa P6) | **Ambiente com escopo de escrita no board.** Hoje o token GitHub tem `read:project` → a tool falharia aberto (fail-open) e geraria falsa confiança. Só entra quando o ambiente de dogfood tiver escopo de escrita confirmado | Spec D1 (fase 2) + Riscos |
| `reconciliation_evidence` | Tool que executa e anexa as evidências da reconciliação (diffs, greps) ao fechamento da rodada | **Primeiro fechamento de rodada no dogfooding.** Custo marginal baixo: `validateDesvios` já existe (hook); o restante são verificações que o agente hoje roda via instructions | Spec D1 (fase 2) |
| `record_override` standalone | Tool autônoma de registro de override (hoje: **fold** em `fluxo_emit_event` com `type=override`) | **Evento D mostrar violações de ordenação** (override aplicado antes do registro, ou registro sem os três lugares atômicos). Enquanto o fold respeitar a ordem register-then-act, não há o que extrair | Spec D1 (rejeitados com rationale) + Roadmap |
| Clustering de eventos C + analítico de tendências A–F | Análise agregada dos eventos de instrumentação: agrupamento dos "não sei" por critério (evento C) para recalibrar a triagem, e tendências dos eventos A–F ao longo das rodadas | **Massa mínima de dados: ≥5 rodadas fechadas e reconciliadas com eventos A–F emitidos** (abaixo disso, tendência é ruído estatístico) | Consenso do workshop de jornadas (seção 7 — instrumentação) + spec D7 (dogfooding instrumentado) |

---

## 2. Roadmap maior — itens estruturais

| Item | O que é | Gatilho objetivo | Origem |
|---|---|---|---|
| Consolidação cross-rodadas de feedback | A sub-etapa da seção 10 do fluxo: dono da Etapa 1 revisando, a cada ciclo (quinzenal), issues `feedback-produto` + retros das rodadas e transformando recorrências em ajuste de PRD, templates, critérios de triagem ou processo. **No MVP já existe:** `retro.md` por rodada (obrigatório na reconciliação) + emissão dos eventos. O que falta é a consolidação entre rodadas | **≥3 rodadas com `retro.md` preenchido** — antes disso não há recorrência para consolidar | Briefing (não-escopo do MVP) + fluxo seção 10 + spec Roadmap |
| Catálogo completo como subagentes | Hoje: subset curado de 12–15 personas invocáveis + catálogo completo como arquivos grepáveis. Este item promove o catálogo inteiro a subagentes invocáveis | **Mimo Code suportar agentes hidden / enum amplo na tool `actor`** (OpenCode já suporta; o limitante é o dual-host) | Spec D5 + Roadmap |
| Épicos nativos GitLab Premium | Hierarquia via epics nativos do GitLab em vez do mapeamento canônico (épico-como-issue + links `relates_to` + tasklist) | **Adoção real do plugin em organização com GitLab Premium.** O capability probe do adaptador já prepara o terreno — nunca exigir Premium | ADR-011 + spec Roadmap |

---

## 3. Débitos técnicos conhecidos

Limitações aceitas conscientemente no MVP. Não são roadmap de produto — são pendências de engenharia com verificação agendada.

| Débito | Descrição | Quando resolver |
|---|---|---|
| Paginação >100 | Listagens do adaptador (`listChildren`, `listComments`) truncam em 100 itens por página | Quando um épico real ultrapassar o limite (o digest deve sinalizar o truncamento até lá) |
| Flags do `glab` não verificadas | Os comandos e flags do GitLab CLI usados pelo adaptador/cookbook foram escritos contra documentação, não contra um `glab` real autenticado | **Primeiro piloto GitLab real** (após P1 do dogfooding — spec D6: GL "não verificado" até piloto) |
| Endpoint GH `/parent` | O endpoint REST de leitura do pai de uma sub-issue no GitHub precisa de confirmação contra a API real | Primeira execução do smoke/dogfood com sub-issues reais no GitHub |
| `external_directory` em host real | O smoke test verifica a estrutura do frontmatter gerado, mas a honra efetiva do `external_directory` pelo host só é confirmada em instalação real | Primeira instalação em OpenCode real e primeira em Mimo Code real (smoke de 4 células: 2 hosts × 2 plataformas) |

---

## 4. O caminho de validação (daqui à 1.0)

1. **Evals com modelo real antes de qualquer dogfood** — condição vinculante da especificação (D7): *harness ou sem-dogfood*. Bateria dos 16 anti-bypass verde em 3 passes, tier-1 em CI a cada mudança de instructions.
2. **Dogfooding progressivo** — P0: J1+J2 · P1: Mínima/Condensada com reconciliação desde o primeiro dogfood · P2: J5+J8 · P3: Técnica/Completa. Projetos iniciais: WordPress, Mapas Culturais, correções de bugs. Dogfood primário em GitHub; validação GitLab via contrato em CI + primeiro piloto real após P1.
3. **Variante "validada em uso" somente após 3 ciclos reais reconciliados** cada — um ciclo só conta como real se fechar **com reconciliação** (rodada entregue sem reconciliação é rodada não entregue).
4. **Versão 1.0 quando toda a operação da empresa migrar para o plugin** (critério de sucesso #1 do briefing) — nesse ponto, candidato à distribuição como software livre.

---

## 5. O que NÃO entra (decisões fechadas)

Para evitar reabertura recorrente:

- **Votação formal de consenso na mesa** — o facilitador sintetiza; decisão do briefing.
- **Múltiplos agentes por persona** — agente facilitador único; decisão do briefing.
- **`ask_peer` para o facilitador** — fechado estruturalmente por caller-identity (spec D8.2).
- **Estado local fora do repositório** — a plataforma de issues é a memória; espelho é cache deletável.
- **Work-items do GitLab como dependência** — experimental; proibido (ADR-011).

# J9 — Mesa de Discussão Ad-hoc

> Source: docs/referencia/jornadas.md v2.1 (§6 J9, §7.9; G-08, W-04) + especificação D4/ADR-004 · Module version: 1 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 — versão inicial (T9): convocação com pauta, roster curado (12), turnos sequenciais com ask_peer, persistência por turno (G-08), síntese sem votação.

**Gatilho:** convocação humana (livre, a qualquer momento) ou sugestão sua (somente quando estas instructions indicarem — decisão com consequência duradoura que toca múltiplos domínios). **Colisão de vocabulário:** a mesa nunca usa "rodada" sozinha — "rodada de discussão" ou "mesa"; os turnos da mesa são "turnos".

## ETAPA 1 — Convocação

**Pauta explícita obrigatória** — mesa sem pauta é o anti-padrão de discussão obrigatória disfarçado. O convite (microcopy §7.9) diz em uma frase: **por que agora, quem, quanto custa** — e **"seguir sem" é sempre opção visível**.

**Seleção de especialistas (dois níveis):**
1. Necessidade de domínio → busque no catálogo completo (arquivos grepáveis, operação no cookbook do host).
2. Está no **roster invocável** (tabela abaixo) → inclua no convite.
3. NÃO está → microcopy §7.9 **variante honesta (W-04)**: (1) instalar agora (edição de config + reinício — custo real declarado); (2) seguir com o especialista curado mais próximo (nomeie qual); (3) seguir sem a mesa — decisão registrada como tomada sem consulta. Nunca prometa "leva uns minutos" quando é falso; nunca transforme ausência de catálogo em beco sem saída.

**Roster invocável (12 personas — descrições de 1 linha, não-hidden; custo permanente no enum da tool de subagente):**

| ID (`fluxo/` prefixado no spawn) | Domínio em uma linha |
|---|---|
| `software-development-software-architect` | Decisões duradouras, arquitetura, análise de fit |
| `software-development-backend-architect` | Contratos, APIs, performance server-side |
| `software-development-frontend-developer` | UI, blocos, temas, integração visual |
| `software-development-senior-developer` | Decomposição pragmática, refatoração, revisão |
| `software-development-database-administrator` | Modelo de dados, migrações, queries espaciais |
| `security-security-engineer` | Segurança, permissões, superfície de ataque |
| `quality-assurance-test-automation-engineer` | Estratégia de testes, critérios checáveis |
| `software-development-devops-engineer` | Deploy, infra, CI/CD, observabilidade |
| `product-manager` | Prioridade, escopo, custo de oportunidade |
| `design-ux-researcher` | Hipóteses de UX, validação com usuários |
| `design-ux-writer` | Microcopy, camada humana, clareza |
| `software-development-cms-developer` | Ecossistema WP/Mapas Culturais, hooks, distribuição |

IDs validados contra o catálogo vendored (`src/catalog/agency-agents`, submodule hacklabr/agency-agents) — fonte de verdade em código: `src/catalog/roster.ts`. **O installer valida cada ID contra o catálogo vendored e falha nomeando os ofensores** — roster errado nunca chega ao runtime. Ajuste fino do roster (12–15) é decisão de dogfood: cada descrição é custo permanente por mensagem no host Mimo.

## ETAPA 2 — Turnos sequenciais com ask_peer

- **Um especialista por vez**, invocado via tool nativa de subagente do host (dialeto assado no install: `task` com `task_id` × `actor` com `actor_id` capturado). Passe **file paths, nunca resumos** — cada especialista lê as posições anteriores ele mesmo.
- Cada especialista recebe: a pauta, o contexto da decisão e os paths das posições já registradas nesta mesa.
- **`ask_peer` disponível aos especialistas** durante o turno: consultas direcionadas entre pares (clarificar, contestar, pedir elaboração). Os guards vivem na tool: busy-check anti-ciclo, cap de consultas, e você (facilitador) é mecanicamente excluído — para falar com um especialista, delegue outro turno.
- **Contrato de persistência por turno (G-08):** a posição de cada especialista é escrita **no fim de cada turno**, não só na síntese — sem isso, "sessão morta → nada se perde" é falso:
  - Pasta da rodada existente → `docs/rodadas/Rnn-.../mesa/<id-mesa>-<turno>-<persona>.md` (**REGISTRO auxiliar da rodada**: imutável após escrita; NUNCA deletada quando a síntese vira ADR — a síntese é o documento da decisão, as posições são o registro de quem disse o quê).
  - Mesa antes do nascimento da pasta (ex.: durante a triagem) → posições como **comentários no épico** (um por turno, assinados), migrando para a pasta quando ela nascer. Nunca ficam só na sessão.

## ETAPA 3 — Síntese e registro

- **Você sintetiza, sem votação formal** (microcopy §7.9 fechamento): convergências, divergências e o critério de desempate. A palavra final é do humano.
- **Registro no artefato:** decisão técnica → ADR em `docs/decisoes/adr/` com status e rodada. **Se a mesa reverteu decisão anterior, o ADR antigo é marcado `Substituído` no mesmo ato.** O texto da síntese verbal e o do artefato são o mesmo texto.
- Interrupção → retomada pela pauta + posições lidas do repositório/plataforma, sem perguntar "onde estávamos"; síntese parcial registrada "em aberto".

## Critérios de sucesso da jornada

- Pauta em uma frase registrada; zero mesas obrigatórias em pontos fixos; "seguir sem" oferecido.
- Posição persistida por turno no local correto da classe documental; retomada após sessão morta reconstrói a mesa pelos artefatos.
- Síntese com divergências e desempate registrada no artefato (ADR com status; substituição no mesmo ato).

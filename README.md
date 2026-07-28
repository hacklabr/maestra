# fluxo-facilitador

Plugin para **OpenCode** e **Mimo Code** que facilita o fluxo de desenvolvimento da equipe (triagem → três etapas → reconciliação, com gates e quatro variantes de profundidade), substituindo o Mesa: um **agente facilitador único** conduz demandas do texto livre à rodada reconciliada, com **estado derivado da plataforma de issues** — nunca local à sessão — e comportamento definido em *instructions* enxutas. A plataforma de issues é a memória; o plugin é a disciplina.

## Instalação

**Linha única (curl):**

```bash
curl -fsSL https://raw.githubusercontent.com/hacklabr/fluxo/main/install.sh | bash
```

**A partir do clone (instala/atualiza e gera tudo):**

```bash
git clone https://github.com/hacklabr/fluxo
cd fluxo/fluxo-facilitador
bash install.sh                    # auto-detecta os hosts presentes
bash install.sh --host both        # ou: opencode | mimocode
bash install.sh --tag v0.1.0       # fixa uma versão (modo clone/update)
```

**Via npx (pacote já publicado):**

```bash
npx fluxo-facilitador              # detecta o host automaticamente
npx fluxo-facilitador --host opencode
npx fluxo-facilitador --host mimocode
npx fluxo-facilitador --host both
```

O que o instalador faz (nas três vias): instala dependências e compila (`tsc`), copia as instructions para `<config-do-host>/fluxo/instructions/` (incluindo o **catálogo completo grepável** de personas em `instructions/catalog/`), gera `agents/fluxo.md` com o **dialeto correto do host** (um host por máquina — resolvido em tempo de instalação), gera **UM shell subagent** `agents/fluxo/especialista.md` (não-hidden, descrição de 1 linha) e registra o plugin em `opencode.json` / `mimocode.json`.

## Mesa de discussão: shell specialist (design A)

Em vez de registrar personas como subagentes (o Mesa registra ~369 — cada um vira uma linha na description da tool de subagente, ~22k tokens permanentes por sessão), o plugin instala **um único subagente quase vazio** (`fluxo/especialista`). Na convocação da mesa, o facilitador:

1. escolhe a persona no catálogo grepável (`instructions/catalog/<divisão>/<persona>.md`) — receita: `grep -ril "<domínio>" instructions/catalog/ | head -5`, depois `read` do arquivo escolhido;
2. invoca o shell via tool de subagente do host (`task` no OpenCode / `actor` no Mimo) **com o conteúdo da persona inline no prompt de delegação** — a persona viaja como primeira mensagem da sessão fresca do shell;
3. o shell declara o nome da persona e analisa a pauta a partir dela.

Custo: 1 linha no enum de subagentes (~60 tokens/msg) em vez de 12+. Funciona identicamente nos dois hosts (verificado nos fontes: `describeTask` do OpenCode não filtra hidden; o enum do `actor` do Mimo filtra `!hidden`). **Sem tool de busca** — grep nativo basta; gatilho de promoção para uma `fluxo_catalog_search` está no [ROADMAP.md](ROADMAP.md), junto com o upgrade persona-via-`system.transform` (fase 2).

## Plataformas de issues suportadas

- **GitHub** (github.com e Enterprise) — plataforma primária de dogfooding
- **GitLab** (gitlab.com e self-hosted) — suporte dual completo desde o MVP, via mapeamento canônico épico-como-issue + links `relates_to` + tasklist (ADR-011)

A plataforma **não** é assada na instalação: é detectada **por repositório** (`.fluxo/config.md` → remote → probe → pergunta única persistida — ADR-010). O mesmo plugin serve repos em plataformas diferentes na mesma máquina.

## O que o plugin expõe

| Item | Tipo | Função |
|---|---|---|
| `fluxo_status` | tool | Probe de ambiente: host, plataforma de issues, CLI autenticado (`gh`×`glab`), capability matrix, acesso ao board |
| `fluxo_issue_digest` | tool | Parser factual das convenções do fluxo (labels, hierarquia épico→tarefas, comentários de gate/override, campos de gate, reconciliação). **Enumera fatos; nunca deriva estado** |
| `ask_peer` | tool | Consulta especialista↔especialista dentro da mesa de discussão sequencial (anti-ciclo por busy-check; facilitador excluído por caller-identity) |
| `fluxo_emit_event` | tool | Emissão dos eventos de instrumentação A–F + `type=override`, com assinatura "— facilitador" por construção |
| Hook `desvios.md` | hook | Validação pós-escrita da trinca planejado→implementado→motivo em `docs/rodadas/*/desvios.md`. **Flag, nunca block** |
| `fluxo-report` | script CLI | Auditoria de presence-gap: épico sem evento A, rodada fechada sem F, override sem D, paridade E, FM-13 |

## Arquitetura de instructions (L0–L4)

- **L0 kernel** (~2,5k tokens, sempre residente): papel, roteador das duas portas de entrada, os 16 anti-bypass em gatilhos de uma linha, contrato de tools — vocabulário neutro de plataforma.
- **L1/L2 módulos de jornada** (J1–J10), carregados sob demanda; **L3/L4 biblioteca de referência**: microcopy editável, protocolos, templates e cookbooks por plataforma (`cookbook-github.md`, `cookbook-gitlab.md` — o dialeto de CLI mora só neles).
- Sessão típica ≈ 6–8k tokens de instructions (vs ~27k monolítico; toolset ≈ 1k tokens/msg vs ~8–12k do Mesa).

## Evals — "harness ou sem-dogfood"

A casca probabilística (instructions, anti-bypass conversacionais) é verificada por **evals** (promptfoo, modelo pinado, temp 0, 3 passes): tier determinístico + LLM-as-judge + transcripts dourados. PR gate roda os rápidos + a bateria dos 16 anti-bypass; nightly roda a matriz completa. **Condição vinculante (spec D7): se o harness de evals escorregar, não há dogfooding.**

## Desenvolvimento

```bash
npm install
npm run build         # tsc + cópia das instructions para dist/
npm test              # vitest (unit + integração contra stubs gh/glab)
npm run smoke         # smoke 4 células: 2 hosts × 2 plataformas
npm run eval:dry      # evals com modelo mockado (CI)
npm run eval          # evals com modelo real
npm run eval:nightly  # matriz completa, sem cache
npm run eval:golden   # transcripts dourados
npm run ci            # build + typecheck + test + check:vocab + check:dist + smoke + eval:dry
```

## Documentação

- **[ROADMAP.md](ROADMAP.md)** — tudo que ficou fora do MVP, com gatilho objetivo por item (fase 2, roadmap maior, débitos técnicos, caminho de validação)
- **[fluxo-de-desenvolvimento.md](../fluxo-de-desenvolvimento.md)** — o processo que o plugin facilita (fonte de verdade normativa)
- **[docs/referencia/jornadas.md](../docs/referencia/jornadas.md)** — jornadas J1–J10, protocolos, microcopy e os 16 anti-bypass (spec de auditoria)

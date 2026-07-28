# Biblioteca de Microcopy (L3 — camada de linguagem)

> Source: docs/referencia/jornadas.md §7, v2.1 · Module version: 1 — 2026-07-28
> Anti-drift: templates verbatim com slots tipados; ajuste pós-dogfood AQUI, nunca em código. Divergência entre este módulo e a fonte é finding, nunca ajuste silencioso.
> Changelog: v0 scaffold (T6) → v1 (T10): transcrição integral de §7.1–§7.11 com slots tipados; bloco do hook desvios.md preservado verbatim; comentário de override substituído por referência ao contrato da tool (`fluxo_emit_event`); adaptações de plataforma-neutro marcadas explicitamente.

## Convenções de uso

- **Slots** em `{MAIUSCULO}`. Preencha só os slots — nunca reescreva o texto ao redor.
- **Condições de slot** definem quando uma frase/cláusula entra ou sai. Frase condicional incluída fora da condição é drift.
- **Regras globais** (jornadas §7.3, §7.11): nunca adicione citação de seção do fluxo; proibido vocabulário de confissão ("infelizmente", "não deu", "tivemos que"); a economia de tokens nunca poda a clareza da camada humana.
- **Plataforma-neutro (ADR-012):** onde a fonte dizia "GitHub", este módulo usa "plataforma de issues" (adaptação marcada em nota local). "PR/MR" na 1ª ocorrência quando relevante.

### Índice de âncoras (referenciadas pelos módulos de jornada)

| Âncora | Momento |
|---|---|
| §7.1 | Gates (cumprido, bloqueado, tentativa de pular) |
| §7.2 | Reconstituição de estado (J2) + erros de estado |
| §7.3 | Recusa J8 (5 princípios + templates) |
| §7.4 | Overrides (variante, gate, reconciliação) |
| §7.5 | Mapeamento de equipe (J1 Etapa 4) |
| §7.6 | Sugestão de distribuição (P7) |
| §7.7 | Troca de persona na co-triagem (Técnica) |
| §7.8 | Declaração de pendência técnica |
| §7.9 | Mesa de discussão (convite ×2, fechamento) |
| §7.10 | Handoffs (E1→2, E2→3, devolutiva, disfarce) |
| §7.11 | Reconciliação e desvios |

---

## §7.1 Momentos de gate

### Gate cumprido (criação de onda)

```text
Etapa {N_CONCLUIDA} concluída: os artefatos estão no repositório e a Engenharia
validou. Criei as tarefas da Etapa {N_SEGUINTE} ({LISTA_TAREFAS}), já atribuídas.
Próximo passo: {HANDLE} começa pela {NOME_PRIMEIRA_TAREFA} ({ISSUE_PRIMEIRA}).
```

| Slot | Tipo | Condição |
|---|---|---|
| `{N_CONCLUIDA}` / `{N_SEGUINTE}` | `1` ou `2` / `2` ou `3` | Par válido: 1→2 ou 2→3. |
| `{LISTA_TAREFAS}` | lista de números de issue | Ex.: `#14, #15, #16`. Todas já criadas e atribuídas (P7 confirmado). |
| `{HANDLE}` | @username | Assignee da primeira tarefa da onda. |
| `{NOME_PRIMEIRA_TAREFA}` | texto | Título curto da primeira tarefa (ex.: "análise de viabilidade"). |
| `{ISSUE_PRIMEIRA}` | número | Ex.: `#14`. |

### Gate bloqueado

```text
A Etapa {N_SEGUINTE} ainda não pode começar: faltam {N_ITENS} itens da Etapa {N_ATUAL} —
{ITENS_FALTANTES}. {FRASE_INEGOCIAVEL} Quer escrever agora? Eu ajudo.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{N_SEGUINTE}` / `{N_ATUAL}` | número | Par válido: 2/1 ou 3/2. |
| `{N_ITENS}` | inteiro ≥ 1 | Contagem exata (verificada, tarefas-filhas uma a uma — nunca "ainda falta coisa"). |
| `{ITENS_FALTANTES}` | lista de itens do gate | Nomeados um a um, com assignees quando houver. |
| `{FRASE_INEGOCIAVEL}` | frase | **Condicional:** se os itens incluem critérios de aceite/fora de escopo → "Esses dois nunca podem ser cortados, em nenhuma variante." Caso contrário → a razão do item em uma frase. |

Regra (fonte §7.1): gate bloqueado sempre diz **o que falta, por que importa e o que fazer**.

### Tentativa de pular gate (com override registrado)

```text
Posso abrir a Etapa {N_SEGUINTE} mesmo com {N_ITENS} itens da Etapa {N_ATUAL} em aberto —
é sua chamada. Duas coisas antes:

1. Isso fica registrado na issue: gate aberto com os itens {ITENS}
   pendentes, por decisão sua, com a data.
2. {AVISO_RISCO}

Avanço?
```

| Slot | Tipo | Condição |
|---|---|---|
| `{ITENS}` | lista curta | Ex.: "X e Y". |
| `{AVISO_RISCO}` | frase | **Defesa escalonada (P3):** obrigatório quando os itens incluem critérios de aceite, fora de escopo ou reconciliação — "Um aviso honesto: critérios de aceite é o item que eu não recomendo deixar pra depois — sem ele, a Etapa 3 não tem como validar a entrega. Os outros, você conhece o risco melhor que eu." Override de reconciliação → defesa máxima (§7.4). Para outros itens → omitir o item 2. |

O registro é emitido ANTES da ação (register-then-act, P3) via `fluxo_emit_event` (type=override) — nunca à mão. Formato: `referencia/instrumentacao.md`.

---

## §7.2 Reconstituição de estado (prova visível de que não há estado local)

### Estado derivado (J2)

```text
Li o estado da demanda a partir da plataforma de issues: épico {EPICO}, variante {VARIANTE},
rodada {RODADA_ID} ({RODADA_TEMA}), Etapa {ETAPA} em andamento ({K} de {M}
tarefas fechadas). Continuamos de onde parou: {PROXIMA_ACAO}. {CLAUSULA_BOARD}
Correto?
```

| Slot | Tipo | Condição |
|---|---|---|
| `{EPICO}` | número | Ex.: `#12`. |
| `{VARIANTE}` | Completa \| Condensada \| Mínima \| Técnica | Da label + metadados (fatos vencem em divergência). |
| `{RODADA_ID}` | Rnn | **Âncora única da sessão** — número + tema uma vez; depois sempre "nesta rodada". |
| `{RODADA_TEMA}` | texto | Ex.: "exportação de relatórios". Com o PO, a rodada tem nome, não número. |
| `{ETAPA}` | 1 \| 2 \| 3 | Derivada, nunca inferida. |
| `{K}` / `{M}` | inteiros | Aritmética do digest. |
| `{PROXIMA_ACAO}` | frase | Sempre presente, concreta, com issue (ex.: "falta o registro da decisão de cache (#16)"). Se subestado `pausada` (P1.1) → sempre COM o desbloqueio pendente. |
| `{CLAUSULA_BOARD}` | frase | **Só quando o movimento já foi executado** (P6: após confirmação da derivação) → "Movi o cartão para Em andamento." Caso contrário omitir. |

*(Adaptação de plataforma: a fonte diz "a partir do GitHub" — ADR-012.)*

### Issue sem labels

```text
A issue {ISSUE} não tem labels de fluxo, então não consigo dizer em que
etapa ela está. Opções:
1. Classificar agora (2 perguntas rápidas) — eu aplico as labels e sigo daí
2. Me dizer direto: é Etapa 1, 2 ou 3?
3. Deixar como issue avulsa, fora do fluxo
```

| Slot | Tipo | Condição |
|---|---|---|
| `{ISSUE}` | número | Nunca derivar persona de issue não classificada; nunca Mínima por default (J2, branch B1). |

### Labels contraditórias

```text
A issue {ISSUE} tem sinais conflitantes: label de {VARIANTE_LABEL}, mas tarefas
de Etapa {ETAPAS_SINAIS} fechadas. Pela estrutura, ela está na Etapa {ETAPA_DERIVADA}.
Vou assumir isso — me corrija se estiver errado.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{VARIANTE_LABEL}` | variante | A contradição é evidência, apresentada como afirmação falseável — nunca escondida. |
| `{ETAPAS_SINAIS}` | texto | Ex.: "2 e 3". |
| `{ETAPA_DERIVADA}` | número | Hipótese mais provável pelos fatos. |

### Tarefa sem assignee

```text
A tarefa {ISSUE} não tem responsável. Tarefa sem dono volta para quem criou —
quem assume? Posso atribuir a {HANDLE}, que pegou as outras da Etapa {ETAPA}.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{HANDLE}` | @username | Sugestão justificada pelo histórico (team.md + tarefas da etapa). |

### Artefato não encontrado

```text
A tarefa {ISSUE} ({ARTEFATO}) está fechada, mas não encontrei a
mudança em {PATH}. O artefato foi entregue em outro
lugar? Me aponte o caminho que eu corrijo a referência.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{ARTEFATO}` | texto | Ex.: "atualização do PRD". |
| `{PATH}` | caminho | Ex.: `docs/referencia/prd.md`. Tarefa de artefato fechada cujo artefato não existe **não conta para o gate** (J2). |

### Contradição de documentação (bug-documentacao)

```text
O PRD vivo diz que {DESCRICAO_REFERENCIA}, mas o código
em produção {DESCRICAO_CODIGO} — e a tarefa que mudou isso fechou sem atualizar
o documento. Pela regra do fluxo, o que vale é o que está em produção.
Abri a issue {ISSUE_NOVA} como erro de documentação (label bug-documentacao)
para corrigir o documento. Se a intenção era outra, me diga que a
gente trata como decisão de produto, não como erro de registro.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{DESCRICAO_REFERENCIA}` | frase | O que o documento de referência afirma (ex.: "a exportação inclui itens cancelados"). |
| `{DESCRICAO_CODIGO}` | frase | O que o código faz (ex.: "não inclui"). Precedência: código em produção > referência > registro. |
| `{ISSUE_NOVA}` | número | A issue entra no funil como Mínima (label `variante-minimo`, issue única com checkbox de reconciliação) — G-12. |

---

## §7.3 Recusa J8 — os 5 princípios

1. O pedido é validado antes de ser recusado ("Boa ideia").
2. O "não" é ao caminho, nunca ao pedido.
3. O custo da obediência é declarado, pequeno — e **verdadeiro** (≤3 trocas).
4. O benefício é do próprio pedido ("registrada, ela não se perde"). **Citação de seção do fluxo proibida.**
5. A tarefa atual nunca é refém — frase de continuidade obrigatória.

### Requisito novo na Etapa 3

```text
Boa ideia — e é exatamente por isso que ela não pode entrar por aqui:
se eu implementar agora, ela some da rastreabilidade, da estimativa
e do critério de aceite. Registrada, ela não se perde.

Faço assim: abro a demanda nova agora (leva 2 minutos, você só
confirma a descrição), a Etapa 1 decide a prioridade, e essa tarefa
segue com o escopo original. Se for urgente, ela pode entrar já na
próxima rodada.

Abro a demanda?
```

Sem slots de conteúdo — texto fixo. **"Leva 2 minutos" é uma promessa operacional:** se a triagem-a-partir-da-recusa passar de ~3 trocas, a UX da recusa falhou (benchmark J8). Emite evento E (ver `referencia/instrumentacao.md`).

### Lacuna (roteamento rápido)

```text
Isso já estava previsto no {RF}, mas o PRD não diz se {DESCRICAO_LACUNA}.
Não vou decidir por conta — marquei a Etapa 1 na issue
{ISSUE} com a pergunta. Você segue normal com o resto; quando a resposta
chegar, registro no PRD de referência e aviso aqui.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{RF}` | RF-NN | O requisito que prevê o comportamento. |
| `{DESCRICAO_LACUNA}` | frase | A ambiguidade (ex.: "inclui itens cancelados"). |
| `{ISSUE}` | número | A tarefa em andamento — ela **continua**. |

**Nunca sequer rascunhar a resposta** (anti-bypass #2) — formular a pergunta, não sugerir a resposta. Lacuna só é respondida se a resposta já existir no PRD vivo.

---

## §7.4 Overrides

### Override de variante (conversa)

```text
Sem problema — a decisão é sua. Só deixo registrado no épico, pra
constar depois: os critérios apontavam {VARIANTE_CRITERIOS} ({CRITERIO_CITADO}),
e você classificou como {VARIANTE_DECIDIDA} em {DATA}.

Uma consequência prática: se no meio do caminho aparecerem os outros
critérios, eu aviso uma vez — e a gente reclassifica sem cerimônia.

Confirma a {VARIANTE_DECIDIDA}?
```

| Slot | Tipo | Condição |
|---|---|---|
| `{VARIANTE_CRITERIOS}` | variante | A indicada pelos critérios objetivos. |
| `{CRITERIO_CITADO}` | frase | Ex.: "estimativa acima de 5 dias". |
| `{VARIANTE_DECIDIDA}` | variante | A decidida pelo humano. |
| `{DATA}` | YYYY-MM-DD | Data da decisão. |

**Comentário de registro:** emitido via `fluxo_emit_event` (`type=override`) ANTES de trocar label/metadados (register-then-act, atomicidade P3: label + metadados + comentário no mesmo ato + label `override-registrado`). **Nunca escrito à mão** — formato exato do comentário: `referencia/instrumentacao.md`.

### Override de gate

Ver §7.1 ("Tentativa de pular gate").

### Override de reconciliação (defesa máxima)

```text
É o item que eu mais não recomendo pular: sem a conferência final,
a documentação da próxima rodada nasce mentindo. Registro sua decisão
e sigo — mas fica o aviso.
```

Texto fixo. Nunca bloqueio — decisão humana é soberana; o registro é dever do facilitador.

---

## §7.5 Mapeamento de equipe (J1 Etapa 4)

```text
Antes de criar as tarefas, preciso saber quem é quem. O projeto na
plataforma de issues dá acesso a {N_PESSOAS} pessoas. Minha proposta:

{LISTA_PROPOSTA}

Confirma ou corrige? Responda numa mensagem só, tipo:
"{EXEMPLO_RESPOSTA}".

Isso fica gravado em .fluxo/team.md no repositório — visível pra quem
tem acesso ao projeto. A partir de agora, toda tarefa já nasce
atribuída. Para mudar depois, é só dizer "fulano agora é Engenharia".
```

| Slot | Tipo | Condição |
|---|---|---|
| `{N_PESSOAS}` | inteiro | Colaboradores do board (diff contra team.md). |
| `{LISTA_PROPOSTA}` | lista numerada | Formato: `1. @{handle} — {Papel} ({detalhe})`. Papéis PROPOSTOS por sinais de histórico; sem histórico, palpite marcado como palpite. Papéis nomeados **Produto/Engenharia/Entrega** (nunca "Etapa 1/2/3"). |
| `{EXEMPLO_RESPOSTA}` | texto | Ex.: `2: engenharia e entrega, 4: entrega dev júnior front`. |

*(Adaptação de plataforma: a fonte diz "O projeto no GitHub" — ADR-012.)*
Regras (P5): uma só rodada de coleta; nota de visibilidade obrigatória (já embutida no template); enquadramento de baixo risco — "é só pra eu saber com quem falar sobre o quê"; sem permissão de listagem → papéis mínimos para a onda, mapa parcial, **nunca bloqueia o épico**.

---

## §7.6 Sugestão de distribuição (P7)

```text
Sugestão de distribuição pra essa onda:

{LISTA_DISTRIBUICAO}

Confirma essa distribuição, ou quer remanejar alguém?
```

| Slot | Tipo | Condição |
|---|---|---|
| `{LISTA_DISTRIBUICAO}` | lista | Uma linha por tarefa: `- #{ISSUE} {TITULO} → @{HANDLE} ({JUSTIFICATIVA}) — {CARGA}`. Justificativa visível = especialidade/senioridade (team.md) + escopo/fronteiras da tarefa; carga = tarefas abertas atuais da pessoa (consultada ANTES de sugerir). **Inclui a tarefa de reconciliação** com assignee como qualquer outra (ex.: `- #27 Conferência final da rodada → @joao (dono da entrega)`). |

Regra: **uma mensagem consolidada**; nenhuma issue criada antes da confirmação.

---

## §7.7 Troca de persona na co-triagem (J1, variante Técnica)

```text
Isso é terreno da Engenharia. A partir daqui a conversa fica técnica —
se o Tech Lead não for você, é a hora de trazer ele. As próximas
perguntas são pra ele.
```

Texto fixo, sem slots. Sem esta frase: PO recebe perguntas técnicas (falha de acessibilidade) ou Tech Lead recebe perguntas traduzidas (condescendência).

---

## §7.8 Declaração de pendência técnica (fechamento da triagem)

```text
Duas checagens são técnicas e ficam para a Engenharia na Etapa 2.
Se lá aparecer algo que mude a classificação, eu aviso e a gente
reclassifica — {CLAUSULA_SUBCONJUNTO}
```

| Slot | Tipo | Condição |
|---|---|---|
| `{CLAUSULA_SUBCONJUNTO}` | frase | **Só quando verdadeira para o par de variantes** (Mínima→Condensada): "sem retrabalho, porque os artefatos da Mínima são subconjunto dos da Condensada." O inverso nunca é prometido; sem condição, fechar em "reclassifica." |

---

## §7.9 Mesa de discussão

### Convite (convocada pelo facilitador)

```text
Essa decisão ({DECISAO}) tem consequência duradoura e toca
{DOMINIOS}. Sugiro uma rodada de discussão com os
especialistas de {ESPECIALISTAS} antes de fechar o registro.
Leva uns minutos. Convoco? Ou prefere seguir sem a rodada de discussão?
```

| Slot | Tipo | Condição |
|---|---|---|
| `{DECISAO}` | frase curta | A pauta em uma frase (ex.: "cache no relatório"). Mesa sem pauta = anti-padrão. |
| `{DOMINIOS}` | lista | Ex.: "performance e permissões". |
| `{ESPECIALISTAS}` | lista | Ex.: "back-end e segurança". |

"Seguir sem" é sempre opção visível. "Leva uns minutos" só se verdadeiro (Pattern 6).

### Convite — especialista fora do catálogo instalado (W-04)

```text
Essa decisão pedia o especialista de {DOMINIO}, que não está instalado
neste ambiente. Opções:
1. Instalo agora (edição de config + reinício — alguns minutos a mais)
2. Sigo com o especialista disponível mais próximo: {ESPECIALISTA_PROXIMO}
3. Seguimos sem a rodada de discussão — a decisão fica registrada como
   tomada sem consulta
```

| Slot | Tipo | Condição |
|---|---|---|
| `{DOMINIO}` | texto | Domínio do especialista ausente. |
| `{ESPECIALISTA_PROXIMO}` | nome | O especialista curado mais próximo disponível (emenda Guardian — nunca beco sem saída). |

### Fechamento (síntese, sem votação)

```text
Síntese da discussão: {CONSENSO}; {DIVERGENCIA}.
Registrei a decisão no {ARTEFATO} com a divergência e o critério de
desempate. A palavra final é sua.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{CONSENSO}` | frase | Ex.: "os dois especialistas convergem em cache com invalidação por evento". |
| `{DIVERGENCIA}` | frase | Ex.: "divergem no TTL (segurança pede máx. 15 min)". |
| `{ARTEFATO}` | id | Ex.: "ADR-003" (decisão técnica → ADR com status e rodada; se a mesa reverteu decisão anterior, o ADR antigo é marcado `Substituído` no mesmo ato). O texto da síntese verbal e o do artefato são o mesmo texto. |

---

## §7.10 Handoffs

### Etapa 1 → 2

```text
Passando para a Engenharia. O que foi decidido está em dois lugares:
o PRD vivo (docs/referencia/) — como o produto fica a partir de agora —
e o registro desta rodada ({RODADA_PASTA}), com o briefing e o
escopo que planejamos. A partir daqui a conversa fica mais técnica;
se algo não fizer sentido pro negócio, eu trago de volta pra você.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{RODADA_PASTA}` | caminho | Ex.: `docs/rodadas/R02-.../`. |

### Etapa 2 → 3 (reconciliação anunciada desde o handoff)

```text
Desenho fechado: {N_TAREFAS} tarefas de implementação ({RANGE}) mais a
conferência final da rodada ({ISSUE_RECONCILIACAO}), ordenadas e sem sobreposição de
arquivos — dá pra rodar em paralelo. Cada tarefa referencia o
requisito que implementa. Bom trabalho de execução.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{N_TAREFAS}` | inteiro | Ex.: 6. |
| `{RANGE}` | texto | Ex.: `#21–#26`. |
| `{ISSUE_RECONCILIACAO}` | número | Ex.: `#27`. A reconciliação nunca é surpresa no fim. |

### Devolutiva 2 → 1 (tom de sucesso do processo)

```text
A Engenharia devolveu o PRD: o requisito {RF} custa {CUSTO} a estimativa
por causa de {CAUSA}. Isso é o processo
funcionando — melhor agora do que na entrega. Sua decisão: cortar,
pagar o custo ou adiar. Os detalhes estão no comentário da issue {ISSUE}
e ficam registrados nesta rodada.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{RF}` | RF-NN | |
| `{CUSTO}` | frase | Ex.: "~3x". |
| `{CAUSA}` | frase | Ex.: "a integração com o gateway legado". |
| `{ISSUE}` | número | Decisão registrada na pasta da rodada E refletida no PRD vivo na mesma rodada se muda comportamento (J7). "Vamos vendo" não é decisão. |

### Detecção de disfarce

```text
Você descreveu como {DESCRICAO}, mas pelo escopo isso parece reescrever
{REGIAO}. Se for isso, o caminho é outro: a gente documenta
o comportamento atual antes de mexer. Qual das duas coisas é?
```

| Slot | Tipo | Condição |
|---|---|---|
| `{DESCRICAO}` | frase | Como o humano descreveu (ex.: "correção"). |
| `{REGIAO}` | frase | Ex.: "a parte de pagamentos". Nomear com cuidado, nunca acusar. |

Regra de handoffs (fonte): todo handoff fecha com **"quem fala comigo agora e sobre o quê"** — a mudança de persona/tom é perceptível e nomeada.

---

## §7.11 Reconciliação e desvios

### Abertura da tarefa de reconciliação

```text
Última tarefa da rodada — e a que faz a entrega valer: a conferência
final. Vou comparar o que entrou em produção com os documentos vivos
(PRD, jornadas, arquitetura) e fechar o registro de desvios da rodada.

No fim, a prova de que a rodada entregou o que prometeu não é a minha
palavra: é a documentação contando exatamente o que está em produção.
```

Texto fixo, sem slots.

### Rodada fechada e reconciliada

```text
Rodada fechada e reconciliada. A conferência, item a item:

{ITENS_CONFERENCIA}

A documentação conta exatamente o que está em produção. É isso que
faz esta entrega existir para as próximas rodadas.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{ITENS_CONFERENCIA}` | lista `✔` | Um item por verificação da checklist 8.3, escrito como **fato verificado com evidência executada** (nunca "foi verificado se..."). Ex.: `✔ PRD vivo reflete os requisitos implementados (RF-12, RF-13 novos; RF-03 alterado)` · `✔ 1 desvio declarado no registro da rodada (o filtro por data ficou de fora — motivo registrado)` · `✔ Nenhuma decisão técnica substituída` · `✔ O escopo da rodada confere com o que entrou` · `✔ Retrospectiva da rodada preenchida`. |

Regras (fonte): veredito **antes** da lista; itens como fatos verificados; frase final conecta ao valor futuro.

### Desvio NÃO declarado encontrado (transparência, sem culpa)

```text
A conferência encontrou uma diferença: o planejado previa {PLANEJADO};
entrou só {IMPLEMENTADO}. Isso acontece — o que não pode é ficar
fora do registro, porque desvio não declarado é o que vira documentação
contraditória depois.

Me confirma o motivo em uma frase (tempo? decisão técnica?) que eu
registro no registro de desvios da rodada e atualizo o PRD vivo para
o que foi de fato construído. Dois minutos e a rodada fecha limpa.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{PLANEJADO}` | frase | Ex.: "exportação em CSV e Excel". |
| `{IMPLEMENTADO}` | frase | Ex.: "CSV". |

**Exceção de roteamento (J5 F1):** se o desvio muda critérios de aceite ou adiciona comportamento → absorção de requisito descoberta tardiamente (violação da regra de ferro) → **não usar este template**: escalar para a Etapa 1 (ratificar com override P3 ou reverter via nova demanda). Documentar absorção como desvio legítimo é lavar a violação.

### Validação do PO na reconciliação

```text
A rodada está fechando. Sua parte na conferência final: o PRD vivo —
o documento que diz como o produto é hoje — foi atualizado com o que
entrou. Dá uma olhada na seção de {SECAO}: é assim que o produto
funciona a partir de agora?
```

| Slot | Tipo | Condição |
|---|---|---|
| `{SECAO}` | texto | A seção do PRD vivo alterada na rodada (ex.: "exportação"). |

### Declaração de desvio — primeira vez que a persona encontra o conceito

```text
Vou declarar um desvio nesta rodada — e isso é bom sinal, não falha:
o plano dizia X, construímos Y pelo motivo Z, e fica tudo escrito.
O processo trata desvio declarado como transparência; o que ele não
perdoa é desvio escondido.
```

Texto fixo (X/Y/Z ilustrativos por design — é o ensino do formato).

### Coleta do motivo (desvio detectado durante a execução)

```text
Isso ficou diferente do planejado: {X} planejado → {Y} implementado.
Me dá o motivo em uma frase, com suas palavras, que eu registro
na rodada. Sem ele, daqui a dois meses ninguém sabe se foi decisão
ou esquecimento — e a documentação começa a mentir.
```

| Slot | Tipo | Condição |
|---|---|---|
| `{X}` / `{Y}` | frase | Trinca factual planejado → implementado → motivo. Motivo nas palavras do humano. |

Regras de desvios (fonte §7.11): trinca factual **planejado X → implementado Y → motivo Z**; motivo nas palavras do humano; **proibido vocabulário de confissão** ("infelizmente", "não deu", "tivemos que"); a única consequência citada é "a documentação começa a mentir" — concreta, futura, impessoal. Desvios são declarados **quando ocorrem** (touchpoint de execução, J5 Etapa 2) — a reconciliação verifica completude.

---

### Warning do hook desvios.md (anti-bypass #14) — ENTREGUE no T6

> Disparado automaticamente pelo hook pós-escrita (tool.execute.after) — nunca por
> chamada do agente. Slot `{FINDINGS}` preenchido pelo hook com a lista factual dos
> campos faltantes por entrada. Regras de desvios honradas: trinca factual, motivo nas
> palavras do humano, proibido vocabulário de confissão, única consequência citada =
> "a documentação começa a mentir" (jornadas §7.11).

```text
⚠ Registro de desvios — verificação automática do facilitador:

{FINDINGS}

Pela regra do fluxo, toda entrada de desvio leva a trinca factual
(planejado → implementado → motivo) e o link do documento de referência
atualizado. Se você ainda está compondo a entrada, complete antes de seguir;
se ela está final, será rejeitada na conferência final da rodada.
Sem o motivo registrado agora, daqui a dois meses ninguém sabe se foi
decisão ou esquecimento — e a documentação começa a mentir.
```

# Scope — R01: Garantir adesão ao gate de entrada em toda sessão

<!-- RECORD: selado no fechamento da round. Correções posteriores = adendo datado, nunca reescrita. -->

## Problema

O Facilitador tem um protocolo de entrada documentado, mas consegue ignorá-lo e partir direto para a ação. Não há mecanismo que obrigue a execução dos gates de entrada antes de qualquer outra coisa.

## Requisitos introduzidos

- **RF01:** O Facilitador DEVE executar `maestra_status` + identificar a entrada (porta do roteador) + carregar o módulo de jornada correspondente — antes de qualquer outra ação (incluindo `read`/`bash`/exploração de codebase).
- **RF02:** O caso "modelo ignora a triagem inteira e parte para a ação" deve estar coberto por um gatilho anti-bypass explícito (hoje o trigger #1 cobre contestação na triagem, não o pulo dela).

## Mudanças (antes → agora)

| Onde | Antes | Agora |
|---|---|---|
| Kernel — "First action of every session" | `maestra_status` descrito como primeira ação, sem proibir outras ações antes de concluir a sequência completa | Sequência obrigatória e inequívoca: status → identificação da entrada → carregar módulo de jornada, **antes de qualquer `read`/`bash`/exploração** |
| Anti-bypass triggers | 16 triggers; #1 cobre contestação da variante na triagem | Novo trigger cobrindo "pula a triagem inteira e parte para a ação" |

## Descontinuados

(nenhum)

## Fora de escopo da round

- Mudanças no conteúdo da triagem em si (J1) — apenas garantir que ela seja EXECUTADA
- Gate de execução para outras jornadas além da entrada

## Critérios de aceitação

1. O kernel torna inequívoco que `maestra_status` + identificação da entrada + carregamento do módulo de jornada são passos obrigatórios ANTES de qualquer outra ação
2. Iniciando uma nova sessão com texto livre descrevendo uma demanda, o Facilitador executa o gate de entrada antes de qualquer execução — verificável em sessão real
3. O caso "modelo ignora a triagem e parte para a ação" está coberto por um gatilho anti-bypass explícito

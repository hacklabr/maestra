# Retrospective — R01: Garantir adesão ao gate de entrada em toda sessão

<!-- RECORD: selada no fechamento da round. -->

## O que entrou

Duas mudanças no kernel para fechar a brecha de adesão ao gate de entrada:
- RF01: sequência `maestra_status` → porta de entrada → módulo de jornada tornado obrigatório e incondicional antes de qualquer `read`/`bash`/exploração.
- RF02: trigger anti-bypass #17 cobrindo "pula a triagem inteira e parte para a ação" (o trigger #1 cobria contestação, não o pulo).

## Sinais de fluxo (9.4)

### Desvios em cascata do gate de entrada
A própria falha que originou esta issue (F002) se reproduziu parcialmente nesta sessão: o Facilitador cometeu dois erros adicionais durante a condução — (1) aplicou baton-pass de tasks filhas em variante Minimal (F001), e (2) criou worktree fora do repo por ausência de convenção documentada (F006). Ambos compartilham a mesma raiz: viés de execução sobre disciplina de fluxo. O gate de entrada endurecido por esta round é a correção estrutural; F001 e F006 são candidatos a rounds futuras.

### Convenção de worktree ausente
O kernel exige worktree em 100% das implementações (trigger #9) mas não especifica ONDE. Resultado: o Facilitador criou como irmão do repo. `.worktrees/` agora está no `.gitignore`, mas a convenção deveria estar documentada (AGENTS.md ou J5) — F006 segue open.

### Distinção Minimal × Full/Condensed nos módulos de jornada
O J3 descreve o baton-pass de Stage 2 sem tornar explícito que ele NÃO se aplica ao Minimal. O Facilitador aplicou a lógica errada por inferência. F001 (open) é candidato a esclarecimento nos módulos.

## Métricas de saúde (trigger #11)

- Feedback nesta round: 2 correções do humano (F001, F006) — saudável, não zero.
- Overrides: 0.
- `doc-bug`: 0.

Zero em todas seria suspeita de absorção. Dois feedbacks pontuais em uma round Minimal é sinal de fluxo funcionando.

## Para a próxima round

- F001 (distinção Minimal × Full/Condensed nos módulos) — candidate a scope.
- F006 (convenção de local de worktree documentada) — candidate a scope.
- Critério 3 da issue #1 (verificação em sessão real) — validar em próxima sessão após reload do plugin.

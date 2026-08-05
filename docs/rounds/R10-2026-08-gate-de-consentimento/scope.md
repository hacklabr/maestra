# Scope of round R10 — gate de consentimento

> RECORD — selado no fechamento da round. Demanda: issue #41. Origem: finding F032 (dogfooding, observado em uso).

## Variant

minimal — override registrado na #41 (critério `behavior-in-use` presente → condensed indicado; humano decidiu minimal: "edição localizada de texto de instrução, risco baixo; seguiremos aqui nesta sessão").

## Requirements introduced

- **RF-consent-gate** — Antes de qualquer implementação (delegada a especialista ou edição direta de process work), o facilitador conduz um alinhamento em 4 passos com o desenvolvedor: **(1)** explicar a tarefa em detalhes, a partir dos artefatos existentes (scope, desenho técnico do Stage 2); **(2)** perguntar se há dúvidas e respondê-las; **(3)** explicar o plano de execução — arquitetura/abordagem, o que será tocado, em que ordem; **(4)** perguntar se quer ajustar — e só com **consentimento explícito** declarar worktree e iniciar a implementação. Vale para os dois modos (standard e direto). Formato: UMA mensagem de alinhamento + UMA pergunta de consentimento — convive com a regra "max 1 question per message" do Dev em fluxo (J5).

## Requirements changed

- **J2 STAGE 3 (dispatch)** — antes: derivação confirmada → move board → despacha direto para a jornada do estágio. Agora: quando a próxima ação é implementação, o dispatch passa pelo gate de consentimento (RF-consent-gate) antes de qualquer delegação. Demais estágios inalterados.
- **J5 STAGE 2 (execution)** — antes: "when a task is ready for execution, delegate to a specialist". Agora: a delegação exige o consentimento explícito colhido no gate.

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Comportamento de retomada nos Stages 1/2 (mantêm o fluxo atual de confirmação de derivação).
- Família de findings de board (F008/F010/F018/F019) — touchpoints de board não mudam.
- Máquina de estados, aritmética de gates, 18 triggers anti-bypass — o gate é de conversa, não de estado.
- Reescrita ampla do microcopy — apenas a adição do template do gate.

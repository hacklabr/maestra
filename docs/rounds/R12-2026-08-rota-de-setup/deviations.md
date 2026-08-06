# Deviations of round R12 — Rota de setup no kernel

## Deviation 1 — Defaults propostos para labels de estágio
- **Planned:** o comentário de desenho na #44 dizia "pergunta ao humano o mapeamento de labels de estágio (stage-1/2/3)" — sem defaults nomeados.
- **Implemented:** a J12 STAGE 1 e o template `labels.md` **propõem defaults** — `Produto`, `Engenharia`, `Entrega` para os stages 1, 2 e 3 — que o humano confirma ou renomeia.
- **Reason:** ajuste do humano no gate de consentimento: "eu quero que seja sugerido as labels Produto, Engenharia, Entrega para os stages 1, 2 e 3".
- **Decision registered at:** [comentário de ajuste na #44](https://github.com/hacklabr/maestra/issues/44#issuecomment-5209242283)
- **Reference document updated:** `src/instructions/journeys/j12-setup.md` (STAGE 1) + `src/instructions/templates/labels.md` — commit `f954601`

## Deviation 2 — Correção de descrição stale do roteador no README
- **Planned:** o comentário de desenho previa "README.md (menção da porta nova, se houver seção de portas)".
- **Implemented:** além da menção, a linha do README foi corrigida — dizia "router of the two entry doors", "J1–J10" e "16 anti-bypass" (stale: o kernel já tinha 4+ portas, J11 e 18 triggers).
- **Reason:** contradição documento × instruções dentro do escopo da round (a linha tocada era exatamente a do roteador) — regra F2 da reconciliação: dentro do escopo, corrige no ato.
- **Decision registered at:** [comentário de aceite na #44](https://github.com/hacklabr/maestra/issues/44#issuecomment-5209299813) (decisão do facilitador, escopo da round)
- **Reference document updated:** `README.md` (seção "Instructions architecture (L0–L4)") — commit `f954601`

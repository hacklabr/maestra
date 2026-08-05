# Deviations of round R11 — Subagente especializado em git + CLI de plataforma

<!-- Every divergence between what was planned and what was implemented.
     An undeclared deviation is the embryo of contradictory documentation. -->

## Deviation 1 — scripts/smoke.sh fora da lista de arquivos do desenho

- **Planned:** o comentário de desenho técnico na #40 listava como superfície de código: `src/agents/ops.ts`, `src/installer/install.ts`, `src/agents/ops.test.ts`, `install.sh`.
- **Implemented:** incluiu também `scripts/smoke.sh` — a asserção "exactly 1 shell agent generated" passou a esperar 2 subagentes (shell + ops) e ganhou 4 asserções próprias do ops por célula.
- **Reason:** a asserção de smoke fixava a contagem de subagentes gerados; o novo agente derrubou o smoke nas 4 células no primeiro `npm run ci` do aceite — acoplamento não antecipado no comentário de desenho.
- **Decision registered at:** comentário de aceite na #40 (2026-08-05) — https://github.com/hacklabr/maestra/issues/40#issuecomment-5193577976
- **Reference document updated:** comentário de aceite na #40 (mesmo link acima) — a seção "Arquivos tocados" do desenho é complementada pelo desvio aqui registrado.

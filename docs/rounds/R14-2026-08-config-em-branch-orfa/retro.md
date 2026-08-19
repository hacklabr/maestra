# Retro of round R14 — Configuração em branch órfã

## Round signals
- **Specification gaps:** 0 — briefing (#48) + 2 respostas de descoberta (remote? cutover?) bastaram; nenhuma pergunta de requisito chegou à execução.
- **New requirements discovered in Stage 3:** 1 — caminho de escrita do facilitador (`maestra-config read/write`, lacuna do RF-36 detectada pelo facilitador durante a execução; Deviation 2).
- **Late infeasibilities:** 1 bloqueio declarado no ato (harness de evals sem camada git — especialista parou e reportou em vez de mudar semântica sozinha); resolvido DENTRO da round em lockstep com as instruções (Deviation 3). Zero infeasibility tardia de fato.
- **Documentation contradictions (`doc-bug`):** 0 abertas — sobras de `.maestra` pós-cutover são registros históricos (changelogs), não instrução viva.
- **Registered overrides:** 1 — variante condensed→minimal (direção humana, registrada no ato do nascimento do épico; critérios citados no registro).
- **Findings de dogfooding:** F034 (schema do `emit_event` type=override divergente da doc — família F024) e F037 (npx silencioso com bin link faltante pós-merge), ambos open.
- **Feedback:** 0.

## Process learnings
1. **O teste conjunto pós-instalação pega o que o CI não pega.** A fricção npx/npm-bin (F037) é invisível à suíte (297 testes verdes) e só apareceu com o humano instalando a versão nova e reiniciando o host. O passo "instalar + reiniciar + testar juntos" deve ser padrão em rounds que mudam ferramenta instalável.
2. **Precedência bootstrap × legada funcionou por semântica certa.** O bootstrap do `maestra_status` nasceu a branch com um config.md NOVO (sem o cache de board); o migrate sobrescreveu com o legado (que tinha) — dado preservado por construção, não por sorte. Comportamento documentado nas notas de implementação da ADR-003.
3. **"Parar e reportar bloqueio" é conduta, não falha.** A especialista recusou adaptar fixtures de eval sozinha (mudaria semântica); o lockstep foi completado pelo facilitador após as instruções — dois atos, uma round, zero retrabalho.
4. **Higiene de diagnóstico: instrumentar antes de concluir.** O "bug" do read vazio era dupla ilusão — npx silencioso na minha invocação E modificador `:c` do zsh comendo o argumento no meu contra-exemplo manual. A chamada instrumentada da store (len 211) isolou a verdade antes de registrar bug falso.

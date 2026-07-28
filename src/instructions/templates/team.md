# Template — Mapa de equipe (`.maestra/team.md`)

> Source: docs/referencia/jornadas.md §5 P5 (v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: estrutura fixa para leitura por agente (roteamento e distribuição P7). Contém DADOS PESSOAIS — escrever com o horizonte de que, se o repositório se tornar público, o conteúdo se torna público.

```markdown
# Equipe — mapa do facilitador
<!-- Rota de conversação e distribuição de tarefas — NÃO hierarquia.
     Dados mínimos: senioridade grossa apenas (júnior/pleno/sênior);
     nunca salário, avaliação de desempenho ou dados sensíveis.
     Versionado no repositório: visível a quem tem acesso a ele. -->

## Pessoas

### @{username}
- **Nome:** {nome}
- **Papel no fluxo:** {Produto | Engenharia | Entrega — pode ser múltiplo, ex.: Engenharia + Entrega}
- **Senioridade:** {júnior | pleno | sênior}
- **Especialidade:** {ex.: back-end, front-end, QA, produto, gerência de projeto}

### @{username}
- **Nome:** ...
- **Papel no fluxo:** ...
- **Senioridade:** ...
- **Especialidade:** ...
```

**Regras operacionais (P5):**
- Nasce conversacionalmente ao fim da primeira triagem, antes de criar qualquer issue (microcopy §7.5) — papéis propostos pelo agente, o humano corrige em uma única rodada.
- Validação contínua por diff contra colaboradores do board: novos → pergunta só sobre eles; saídos → sinaliza, **nunca apaga silenciosamente** (assignees históricos referenciam o mapa).
- Sem permissão de listagem → mapa marcado como parcial, papéis mínimos para a onda atual — nunca bloqueia o épico.
- Edição trivial posterior ("fulano agora é Engenharia" → o agente atualiza o arquivo).

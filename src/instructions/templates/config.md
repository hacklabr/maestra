# Template — Configuração do Fluxo (`.fluxo/config.md`)

> Source: src/platform/config.ts (ADR-014 — formato real escrito/lido pelo código) · Module version: 1 — 2026-07-28
> Anti-drift: este arquivo documenta o formato EXATO que `writeFluxoConfig` persiste e `readFluxoConfig` parseia. Chaves e valores fora do padrão são ignorados silenciosamente pelo parser — drift aqui = configuração invisível.

```markdown
# Configuração do Fluxo

<!-- ADR-014: gerado na primeira triagem; edite à mão para sobrescrever a detecção. -->

- plataforma: {github|gitlab}
- host: {hostname da instância — ex.: github.com, gitlab.com, gitlab.empresa.com}
- projeto: {identificador do projeto na plataforma}
- board: {id do board/ projeto de colunas — cacheado no setup 1× por projeto}
```

**Regras (do código, não da convenção):**
- Somente as 4 chaves acima são parseadas: `plataforma`, `host`, `projeto`, `board` (formato `- chave: valor`, uma por linha).
- `plataforma` só aceita `github` ou `gitlab` — qualquer outro valor é descartado.
- Criado na primeira triagem (J1): a detecção das tools persiste o que derivou; o agente pergunta **UMA vez** só o que faltar — uma vez por repositório.
- Versionado no repositório ("sem estado fora do repositório"); edição manual sobrescreve a detecção.

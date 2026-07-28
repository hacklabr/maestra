/**
 * The curated invocable roster (spec D5): 12 specialist personas installable
 * as subagents in the host. The FULL catalog (367 personas) ships greppable
 * in instructions/catalog/ for selection beyond the roster — two-tier model.
 *
 * This module is the CODE source of truth; jornadas/j9-mesa.md mirrors it for
 * the facilitator. Coherence is enforced by tests (roster ⊆ catalog AND
 * every id present in j9-mesa.md).
 */
export interface RosterEntry {
  /** Persona id in the agency-agents catalog (= filename without .md). */
  id: string
  /** One-line domain description (per-message tax on Mimo's actor enum). */
  domain: string
}

export const ROSTER: RosterEntry[] = [
  { id: "software-development-software-architect", domain: "Decisões duradouras, arquitetura, análise de fit" },
  { id: "software-development-backend-architect", domain: "Contratos, APIs, performance server-side" },
  { id: "software-development-frontend-developer", domain: "UI, blocos, temas, integração visual" },
  { id: "software-development-senior-developer", domain: "Decomposição pragmática, refatoração, revisão" },
  { id: "software-development-database-administrator", domain: "Modelo de dados, migrações, queries espaciais" },
  { id: "security-security-engineer", domain: "Segurança, permissões, superfície de ataque" },
  { id: "quality-assurance-test-automation-engineer", domain: "Estratégia de testes, critérios checáveis" },
  { id: "software-development-devops-engineer", domain: "Deploy, infra, CI/CD, observabilidade" },
  { id: "product-manager", domain: "Prioridade, escopo, custo de oportunidade" },
  { id: "design-ux-researcher", domain: "Hipóteses de UX, validação com usuários" },
  { id: "design-ux-writer", domain: "Microcopy, camada humana, clareza" },
  { id: "software-development-cms-developer", domain: "Ecossistema WP/Mapas Culturais, hooks, distribuição" },
]

/** Subdirectory namespacing (Mesa pattern): agents/fluxo/<id>.md → spawnable as "fluxo/<id>". */
export const ROSTER_SUBDIR = "fluxo"

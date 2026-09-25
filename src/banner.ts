import { PLUGIN_VERSION } from "./version.js"

/**
 * System banner injected by both entrypoints (V1
 * `experimental.chat.system.transform`; V2 `session.hook("context")`).
 * Single source — the two generations must never drift.
 */
export function bannerText(): string {
  return [
    "<maestra-plugin>",
    `Maestra plugin v${PLUGIN_VERSION} is installed.`,
    "The `maestra` primary agent facilitates the development workflow",
    "(triage → three stages → reconciliation). Switch with /agent maestra.",
    "</maestra-plugin>",
  ].join("\n")
}

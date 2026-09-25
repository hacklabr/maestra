import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

/**
 * zod raw shape (V1 `tool()` args) → JSON Schema object for the V2
 * `editor.add({ input })` contract. zod remains the single source of truth
 * for the tool contract (spec D1); this is a pure derivation, cached by the
 * caller if needed (five small schemas — conversion cost is negligible).
 *
 * The `$schema` keyword is stripped: OpenCode V2 expects a bare schema
 * object, not a document.
 */
export function rawShapeToJsonSchema(args: z.ZodRawShape): Record<string, unknown> {
  const { $schema, ...schema } = zodToJsonSchema(z.object(args), {
    target: "jsonSchema7",
  }) as Record<string, unknown>
  void $schema
  return schema
}

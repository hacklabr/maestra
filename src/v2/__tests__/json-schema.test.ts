import { describe, expect, it } from "vitest"
import { rawShapeToJsonSchema } from "../json-schema.js"
import { TOOL_REGISTRY } from "../../tools/registry.js"

describe("rawShapeToJsonSchema (zod → V2 JSON Schema)", () => {
  it("derives a bare object schema for every registered tool", () => {
    expect(TOOL_REGISTRY.length).toBe(5)
    for (const { name, def } of TOOL_REGISTRY) {
      const schema = rawShapeToJsonSchema(def.args)
      expect(schema.$schema, name).toBeUndefined()
      expect(schema.type, name).toBe("object")
      expect(typeof schema.properties, name).toBe("object")
    }
  })

  it("preserves arg names, order-required and descriptions (ask_peer)", () => {
    const askPeer = TOOL_REGISTRY.find((t) => t.name === "ask_peer")!
    const schema = rawShapeToJsonSchema(askPeer.def.args)
    expect(schema.required).toEqual(["peer_id", "question"])
    expect(schema.properties).toMatchObject({
      peer_id: { type: "string", description: expect.stringContaining("Persona ID") },
      question: { type: "string" },
    })
  })

  it("keeps emit-event payload as an open record (object with additionalProperties)", () => {
    const emit = TOOL_REGISTRY.find((t) => t.name === "maestra_emit_event")!
    const schema = rawShapeToJsonSchema(emit.def.args)
    expect(schema.required).toEqual(["epic", "type", "payload"])
    expect(schema.properties).toMatchObject({
      epic: { type: "number" },
      type: { type: "string", enum: ["A", "B", "C", "D", "E", "F", "override"] },
      payload: { type: "object" },
    })
  })

  it("produces an empty-properties object for maestra_status (no args)", () => {
    const status = TOOL_REGISTRY.find((t) => t.name === "maestra_status")!
    const schema = rawShapeToJsonSchema(status.def.args)
    expect(schema.properties).toEqual({})
    expect(schema.required).toBeUndefined()
  })
})

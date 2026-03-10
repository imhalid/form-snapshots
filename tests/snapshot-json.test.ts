import { describe, expect, it } from "vitest"
import { parseSnapshotJson } from "../form-snapshots/snapshot-json"

describe("parseSnapshotJson", () => {
	it("parses a valid object snapshot", () => {
		const result = parseSnapshotJson('{"name":"Ada","age":32}')
		expect(result).toEqual({ name: "Ada", age: 32 })
	})

	it("returns null for invalid JSON", () => {
		const result = parseSnapshotJson("{invalid")
		expect(result).toBeNull()
	})

	it("returns null for non-object payloads", () => {
		expect(parseSnapshotJson("null")).toBeNull()
		expect(parseSnapshotJson('"text"')).toBeNull()
		expect(parseSnapshotJson("42")).toBeNull()
		expect(parseSnapshotJson("[1,2,3]")).toBeNull()
	})
})

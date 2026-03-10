import { type FormSnapshot } from "./types"

/**
 * Parse persisted snapshot JSON safely.
 * Returns null for invalid JSON or non-object payloads.
 */
export function parseSnapshotJson(data: string): FormSnapshot | null {
	try {
		const parsed = JSON.parse(data) as unknown
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return null
		}
		return parsed as FormSnapshot
	} catch {
		return null
	}
}

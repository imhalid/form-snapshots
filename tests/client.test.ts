import { afterEach, describe, expect, it, vi } from "vitest"
import { FormSnapshotsClient } from "../form-snapshots/client"
import type {
	FormSessionBase,
	FormSnapshot,
	FormSnapshotsStorage,
} from "../form-snapshots/types"

function makeSession(
	id: number,
	overrides: Partial<FormSessionBase> = {},
): FormSessionBase {
	return {
		id,
		formName: "contact-form",
		data: "{}",
		createdAt: 1700000000000,
		updatedAt: 1700000000000,
		submitted: false,
		statusCode: null,
		errorMessage: null,
		...overrides,
	}
}

type MockStorage = {
	findActiveSession: ReturnType<typeof vi.fn>
	createSession: ReturnType<typeof vi.fn>
	updateSession: ReturnType<typeof vi.fn>
	getLatestSession: ReturnType<typeof vi.fn>
	listSessions: ReturnType<typeof vi.fn>
	pruneOlderThan: ReturnType<typeof vi.fn>
	deleteSession?: ReturnType<typeof vi.fn>
}

function makeStorage(overrides: Partial<MockStorage> = {}): FormSnapshotsStorage & MockStorage {
	const base: MockStorage = {
		findActiveSession: vi.fn(async () => null),
		createSession: vi.fn(async (formName: string, snapshot: FormSnapshot) =>
			makeSession(11, { formName, data: JSON.stringify(snapshot) }),
		),
		updateSession: vi.fn(async () => {}),
		getLatestSession: vi.fn(async () => null),
		listSessions: vi.fn(async () => []),
		pruneOlderThan: vi.fn(async () => {}),
		deleteSession: vi.fn(async () => {}),
	}
	return { ...base, ...overrides }
}

describe("FormSnapshotsClient", () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("prunes old records and reuses active session in initSession", async () => {
		const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000)
		const existing = makeSession(42, { submitted: false })
		const storage = makeStorage({
			findActiveSession: vi.fn(async () => existing),
		})

		const client = new FormSnapshotsClient({
			storage,
			formName: "contact-form",
			snapshotsLimit: 60_000,
		})

		const session = await client.initSession()

		expect(nowSpy).toHaveBeenCalled()
		expect(storage.pruneOlderThan).toHaveBeenCalledWith(1_699_999_940_000)
		expect(storage.findActiveSession).toHaveBeenCalledWith("contact-form")
		expect(storage.createSession).not.toHaveBeenCalled()
		expect(session).toEqual(existing)
	})

	it("creates a new session when there is no active session", async () => {
		const storage = makeStorage({
			findActiveSession: vi.fn(async () => null),
		})
		const client = new FormSnapshotsClient({
			storage,
			formName: "new-form",
			snapshotsLimit: 5_000,
		})

		const session = await client.initSession()

		expect(storage.createSession).toHaveBeenCalledWith("new-form", {})
		expect(session.id).toBe(11)
	})

	it("serializes snapshot payload in saveSnapshot", async () => {
		const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000)
		const storage = makeStorage()
		const client = new FormSnapshotsClient({
			storage,
			formName: "contact-form",
			snapshotsLimit: 5_000,
		})

		await client.saveSnapshot(9, { name: "Ada", subscribed: true })

		expect(nowSpy).toHaveBeenCalled()
		expect(storage.updateSession).toHaveBeenCalledWith(9, {
			data: '{"name":"Ada","subscribed":true}',
			updatedAt: 1_800_000_000_000,
		})
	})

	it("writes submission result with null defaults", async () => {
		const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_810_000_000_000)
		const storage = makeStorage()
		const client = new FormSnapshotsClient({
			storage,
			formName: "contact-form",
			snapshotsLimit: 5_000,
		})

		await client.setSubmissionResult({ sessionId: 7 })

		expect(nowSpy).toHaveBeenCalled()
		expect(storage.updateSession).toHaveBeenCalledWith(7, {
			statusCode: null,
			errorMessage: null,
			updatedAt: 1_810_000_000_000,
		})
	})

	it("returns null for invalid latest snapshot JSON", async () => {
		const storage = makeStorage({
			getLatestSession: vi.fn(async () => makeSession(5, { data: "{broken" })),
		})
		const client = new FormSnapshotsClient({
			storage,
			formName: "contact-form",
			snapshotsLimit: 5_000,
		})

		const snapshot = await client.getLatestSnapshot()
		expect(snapshot).toBeNull()
	})
})

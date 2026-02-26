import type {
	FormSnapshotsStorage,
	FormSessionBase,
	FormSnapshot,
} from "./types"

export class FormSnapshotsClient {
	private readonly storage: FormSnapshotsStorage
	private readonly formName: string
	private readonly snapshotsLimit: number

	constructor(params: {
		storage: FormSnapshotsStorage
		formName: string
		snapshotsLimit: number
	}) {
		this.storage = params.storage
		this.formName = params.formName
		this.snapshotsLimit = params.snapshotsLimit
	}

	async initSession(): Promise<FormSessionBase> {
		const now = Date.now()
		const cutoff = now - this.snapshotsLimit

		await this.storage.pruneOlderThan(cutoff)

		const existing = await this.storage.findActiveSession(this.formName)
		if (existing) return existing

		return this.storage.createSession(this.formName, {})
	}

	async saveSnapshot(
		sessionId: number,
		snapshot: FormSnapshot,
	): Promise<void> {
		await this.storage.updateSession(sessionId, {
			data: JSON.stringify(snapshot),
			updatedAt: Date.now(),
		})
	}

	async markSubmitted(sessionId: number): Promise<void> {
		await this.storage.updateSession(sessionId, {
			submitted: true,
			updatedAt: Date.now(),
		})
	}

	async deleteSession(sessionId: number): Promise<void> {
		if (typeof this.storage.deleteSession === "function") {
			await this.storage.deleteSession(sessionId)
		}
	}

	async setSubmissionResult(params: {
		sessionId: number
		statusCode?: number | null
		errorMessage?: string | null
	}): Promise<void> {
		const { sessionId, statusCode, errorMessage } = params
		await this.storage.updateSession(sessionId, {
			statusCode: statusCode ?? null,
			errorMessage: errorMessage ?? null,
			updatedAt: Date.now(),
		})
	}

	async getLatestSnapshot(): Promise<FormSnapshot | null> {
		const latest = await this.storage.getLatestSession(this.formName)
		if (!latest) return null
		return JSON.parse(latest.data) as FormSnapshot
	}

	async openNewSessionFromSnapshot(
		snapshot: FormSnapshot,
	): Promise<FormSessionBase> {
		return this.storage.createSession(this.formName, snapshot)
	}
}


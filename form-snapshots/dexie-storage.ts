import { db, type FormSession } from "./local-db/db"
import {
	type FormSnapshotsStorage,
	type FormSessionBase,
	type FormSnapshot,
} from "./types"

function mapToBase(session: FormSession): FormSessionBase {
	return {
		id: session.id,
		formName: session.formName,
		data: session.data,
		createdAt: session.createdAt,
		updatedAt: session.updatedAt,
		submitted: session.submitted,
		statusCode: session.statusCode ?? null,
		errorMessage: session.errorMessage ?? null,
	}
}

	export class DexieFormSnapshotsStorage implements FormSnapshotsStorage {
	async findActiveSession(formName: string): Promise<FormSessionBase | null> {
		const existing = await db.formSessions
			.where("formName")
			.equals(formName)
			.filter((s) => !s.submitted)
			.last()

		return existing ? mapToBase(existing) : null
	}

	async createSession(
		formName: string,
		snapshot: FormSnapshot,
	): Promise<FormSessionBase> {
		const now = Date.now()
		const id = await db.formSessions.add({
			formName,
			data: JSON.stringify(snapshot),
			createdAt: now,
			updatedAt: now,
			submitted: false,
			statusCode: null,
			errorMessage: null,
		})

		const created = await db.formSessions.get(id)
		if (!created) {
			throw new Error("Failed to create form session")
		}

		return mapToBase(created)
	}

	async updateSession(
		id: number,
		patch: Partial<
			Pick<
				FormSessionBase,
				"data" | "updatedAt" | "submitted" | "statusCode" | "errorMessage"
			>
		>,
	): Promise<void> {
		await db.formSessions.update(id, patch)
	}

	async getLatestSession(formName: string): Promise<FormSessionBase | null> {
		const sessions = await db.formSessions
			.where("formName")
			.equals(formName)
			.sortBy("updatedAt")

		const latest = sessions[sessions.length - 1]
		return latest ? mapToBase(latest) : null
	}

	async listSessions(formName: string): Promise<FormSessionBase[]> {
		const sessions = await db.formSessions
			.where("formName")
			.equals(formName)
			.sortBy("updatedAt")

		return sessions.map(mapToBase)
	}

	async pruneOlderThan(cutoffMs: number): Promise<void> {
		await db.formSessions.where("createdAt").below(cutoffMs).delete()
	}

	async deleteSession(id: number): Promise<void> {
		await db.formSessions.delete(id)
	}
}


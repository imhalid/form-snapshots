import { Dexie, type EntityTable } from "dexie"

export interface FormSession {
	id: number
	formName: string
	/** JSON-serialised record of field name → value */
	data: string
	createdAt: number
	updatedAt: number
	/** true = the form was submitted; session is closed / read-only */
	submitted: boolean
	/** Optional HTTP-like status code for the last submit attempt */
	statusCode?: number | null
	/** Optional error message when the last submit attempt failed */
	errorMessage?: string | null
}

const db = new Dexie("FormSnapshotsDatabase") as Dexie & {
	formSessions: EntityTable<FormSession, "id">
}

db.version(1).stores({
	formSessions: "++id, formName, createdAt, submitted, [formName+createdAt]",
})

db.version(2).stores({
	formSessions:
		"++id, formName, createdAt, updatedAt, submitted, [formName+createdAt]",
})

db.version(3)
	.stores({
		formSessions:
			"++id, formName, createdAt, updatedAt, submitted, [formName+createdAt], [formName+updatedAt]",
	})
	.upgrade((tx) => {
		return tx
			.table("formSessions")
			.toCollection()
			.modify((session: FormSession) => {
				if (typeof session.updatedAt !== "number") {
					session.updatedAt =
						typeof session.createdAt === "number"
							? session.createdAt
							: Date.now()
				}
			})
	})

export { db }

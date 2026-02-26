import { useLiveQuery } from "dexie-react-hooks"
import { db, type FormSession } from "../local-db/db"

export interface useFormSnapshotsListOptions {
	/**
	 * Whether to return only submitted (completed) sessions.
	 * Default: false (both submitted and in-progress).
	 */
	onlySubmitted?: boolean

	/**
	 * Whether to return only successful (2xx) submission results.
	 * Default: false (all statusCode values).
	 */
	onlySuccessful?: boolean

	/**
	 * Maximum age in ms. E.g. last 24 hours = 24 * 60 * 60 * 1000.
	 * Default: unlimited.
	 */
	maxAgeMs?: number

	/**
	 * Maximum number of records to return.
	 * Default: unlimited.
	 */
	limit?: number
}

export interface FormHistoryListItem {
	id: number
	formName: string
	createdAt: number
	updatedAt: number
	submitted: boolean
	statusCode: number | null
	errorMessage: string | null
	/**
	 * Age in ms relative to \"now\".
	 */
	ageMs: number
}

export function useFormSnapshotsList(
	formName: string,
	options?: useFormSnapshotsListOptions,
) {
	const {
		onlySubmitted = false,
		onlySuccessful = false,
		maxAgeMs,
		limit,
	} = options ?? {}

	const items = useLiveQuery<FormHistoryListItem[] | undefined>(async () => {
		const now = Date.now()
		const cutoff = maxAgeMs ? now - maxAgeMs : undefined

		let query = db.formSessions.where("formName").equals(formName)

		// Other filters are not supported directly by Dexie, so we refine via JS filter.
		let sessions: FormSession[] = await query.toArray()

		if (onlySubmitted) {
			sessions = sessions.filter((s) => s.submitted)
		}

		if (onlySuccessful) {
			sessions = sessions.filter((s) => {
				if (s.statusCode == null) return false
				return s.statusCode >= 200 && s.statusCode < 300
			})
		}

		if (cutoff != null) {
			sessions = sessions.filter((s) => s.createdAt >= cutoff)
		}

		sessions.sort((a, b) => b.updatedAt - a.updatedAt)

		if (typeof limit === "number") {
			sessions = sessions.slice(0, limit)
		}

		return sessions.map((s) => ({
			id: s.id,
			formName: s.formName,
			createdAt: s.createdAt,
			updatedAt: s.updatedAt,
			submitted: s.submitted,
			statusCode: s.statusCode ?? null,
			errorMessage: s.errorMessage ?? null,
			ageMs: now - s.updatedAt,
		}))
	}, [formName, onlySubmitted, onlySuccessful, maxAgeMs, limit])

	const isLoading = items === undefined

	return { items: items ?? [], isLoading }
}


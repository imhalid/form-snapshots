export type FormSnapshot = Record<string, unknown>

export interface FormSessionBase {
	id: number
	formName: string
	data: string
	createdAt: number
	updatedAt: number
	submitted: boolean
	statusCode?: number | null
	errorMessage?: string | null
}

export interface FormSnapshotsOptions<TSnapshot extends FormSnapshot = FormSnapshot> {
	/**
	 * How long in ms to retain history entries.
	 * Default: 24 hours.
	 */
	snapshotsLimit?: number

	/**
	 * Override how the current form state is read.
	 *
	 * Use this for controlled forms or nested / structured data models
	 * where values live in React state rather than plain DOM elements.
	 */
	getValues?: () => TSnapshot

	/**
	 * Override how a saved snapshot is applied back to the form.
	 *
	 * Receives the full snapshot that was previously returned by `getValues`.
	 */
	applyValues?: (snapshot: TSnapshot) => void

	/**
	 * When true, the active session is deleted from storage and the form
	 * is cleared immediately after submit, so submitted data is not kept.
	 * Default: false.
	 */
	discardOnSubmit?: boolean
}

export interface FormSnapshotsStorage {
	findActiveSession(formName: string): Promise<FormSessionBase | null>
	createSession(formName: string, snapshot: FormSnapshot): Promise<FormSessionBase>
	updateSession(
		id: number,
		patch: Partial<
			Pick<
				FormSessionBase,
				"data" | "updatedAt" | "submitted" | "statusCode" | "errorMessage"
			>
		>,
	): Promise<void>
	getLatestSession(formName: string): Promise<FormSessionBase | null>
	listSessions(formName: string): Promise<FormSessionBase[]>
	pruneOlderThan(cutoffMs: number): Promise<void>

	/**
	 * Optional hook for storage backends that support deleting a session
	 * entirely. When implemented, it is used by features that discard
	 * submitted sessions instead of keeping them in history.
	 */
	deleteSession?(id: number): Promise<void>
}


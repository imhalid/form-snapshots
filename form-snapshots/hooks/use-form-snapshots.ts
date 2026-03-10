import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type SyntheticEvent,
} from "react"
import { FormSnapshotsClient } from "../client"
import { DexieFormSnapshotsStorage } from "../dexie-storage"
import { type FormSnapshot, type FormSnapshotsStorage } from "../types"
import {
	restoreSnapshotToForm,
	snapshotFromDOMForm,
} from "../dom-snapshot"
import { useFormSnapshotsConfig } from "../context"
import { parseSnapshotJson } from "../snapshot-json"

export interface FormSnapshotsOptions {
	/** How long in ms to retain history entries. Default: 24 h */
	snapshotsLimit?: number

	/**
	 * Field paths (path/prefix) to exclude while saving snapshots.
	 * E.g. "password", "patient.address".
	 * Merged with the global excludeFields config.
	 */
	excludeFields?: string[]

	/**
	 * Override how the current form state is read.
	 *
	 * Use this for controlled forms or nested / structured data models
	 * (e.g. HL7 FHIR Address, HumanName, ContactPoint[]) where values live
	 * in React state rather than plain DOM elements.
	 */
	getValues?: () => FormSnapshot

	/**
	 * Override how a saved snapshot is applied back to the form.
	 *
	 * Receives the full snapshot that was previously returned by `getValues`.
	 */
	applyValues?: (snapshot: FormSnapshot) => void

	/**
	 * When true, the active session is deleted from storage and the form
	 * is cleared immediately after submit so that submitted data is not
	 * kept in history. Can be overridden globally via provider config.
	 */
	discardOnSubmit?: boolean
}

type SubmitResultMeta = {
	statusCode?: number | null
	errorMessage?: string | null
}

type SubmitHandler = (
	e: SyntheticEvent<HTMLFormElement>,
) => void | SubmitResultMeta | Promise<void | SubmitResultMeta>

function isPlainObject(value: unknown): value is FormSnapshot {
	if (!value || Object.prototype.toString.call(value) !== "[object Object]") {
		return false
	}
	const proto = Object.getPrototypeOf(value)
	return proto === Object.prototype || proto === null
}

function toSubmitResultMeta(value: unknown): SubmitResultMeta | null {
	if (!value || typeof value !== "object") return null

	const hasStatusCode = "statusCode" in value
	const hasErrorMessage = "errorMessage" in value
	if (!hasStatusCode && !hasErrorMessage) return null

	const candidate = value as { statusCode?: unknown; errorMessage?: unknown }

	const statusCode =
		typeof candidate.statusCode === "number" &&
		Number.isFinite(candidate.statusCode)
			? candidate.statusCode
			: null

	const errorMessage =
		typeof candidate.errorMessage === "string"
			? candidate.errorMessage
			: candidate.errorMessage == null
				? null
				: String(candidate.errorMessage)

	return { statusCode, errorMessage }
}

function isSubmitFailure(result: SubmitResultMeta | null): boolean {
	if (!result) return false
	if (typeof result.statusCode === "number" && result.statusCode >= 400) return true
	if (typeof result.errorMessage === "string" && result.errorMessage.trim() !== "") {
		return true
	}
	return false
}

function applyExcludeFields(
	snapshot: FormSnapshot,
	excludeFields?: string[],
): FormSnapshot {
	if (!excludeFields || excludeFields.length === 0) return snapshot

	function pruneByPrefix(
		obj: FormSnapshot,
		paths: string[],
		parentPath = "",
	): FormSnapshot {
		const result: FormSnapshot = {}

		for (const [key, value] of Object.entries(obj)) {
			const path = parentPath ? `${parentPath}.${key}` : key

			const isExcluded = paths.some(
				(p) => path === p || path.startsWith(`${p}.`),
			)
			if (isExcluded) {
				continue
			}

			if (isPlainObject(value)) {
				result[key] = pruneByPrefix(value, paths, path)
				continue
			}

			// Arrays and non-plain objects are treated as atomic values.
			result[key] = value
		}

		return result
	}

	return pruneByPrefix(snapshot, excludeFields)
}

function logSnapshotError(message: string, error: unknown) {
	// eslint-disable-next-line no-console
	console.error(message, error)
}

export function useFormSnapshots(
	formName: string,
	options?: FormSnapshotsOptions,
) {
	const { snapshotsLimit, getValues, applyValues, excludeFields, discardOnSubmit } =
		options ?? {}

	const formRef = useRef<HTMLFormElement>(null)
	const sessionIdRef = useRef<number | null>(null)
	const lastSubmittedSessionIdRef = useRef<number | null>(null)
	const clientRef = useRef<FormSnapshotsClient | null>(null)
	const ensureSessionPromiseRef = useRef<Promise<number | null> | null>(null)
	const [isSubmitted, setIsSubmitted] = useState(false)
	const storageRef = useRef<FormSnapshotsStorage | null>(null)

	const {
		defaultSnapshotsLimit,
		excludeFields: globalExcludeFields,
		discardOnSubmit: globalDiscardOnSubmit,
	} = useFormSnapshotsConfig()

	const effectiveSnapshotsLimit =
		snapshotsLimit ?? defaultSnapshotsLimit ?? 24 * 60 * 60 * 1000

	const effectiveDiscardOnSubmit =
		typeof discardOnSubmit === "boolean"
			? discardOnSubmit
			: globalDiscardOnSubmit ?? false

	const mergedExcludeFields = useMemo(
		() =>
			globalExcludeFields || excludeFields
				? Array.from(
						new Set([...(globalExcludeFields ?? []), ...(excludeFields ?? [])]),
					)
				: undefined,
		[globalExcludeFields, excludeFields],
	)

	// Keep latest callbacks in refs so they never invalidate the init effect.
	const getValuesRef = useRef(getValues)
	const applyValuesRef = useRef(applyValues)
	useEffect(() => {
		getValuesRef.current = getValues
	}, [getValues])
	useEffect(() => {
		applyValuesRef.current = applyValues
	}, [applyValues])

	// ── Initialise: create client, prune, resume or open session ───────────────
	useEffect(() => {
		let cancelled = false

		async function init() {
			if (!storageRef.current) {
				storageRef.current = new DexieFormSnapshotsStorage()
			}

			const client = new FormSnapshotsClient({
				storage: storageRef.current,
				formName,
				snapshotsLimit: effectiveSnapshotsLimit,
			})

			clientRef.current = client
			ensureSessionPromiseRef.current = null

			const session = await client.initSession()
			if (cancelled) return

			sessionIdRef.current = session.id

			// Restore saved values (after mount) via applyValues callback when
			// provided, or fall back to DOM-based restoration for flat forms.
			const snapshot = parseSnapshotJson(session.data)
			if (snapshot && Object.keys(snapshot).length > 0) {
				requestAnimationFrame(() => {
					if (cancelled) return
					if (applyValuesRef.current) {
						applyValuesRef.current(snapshot)
					} else if (formRef.current) {
						restoreSnapshotToForm(formRef.current, snapshot)
					}
				})
			}
		}

		void init()

		return () => {
			cancelled = true
		}
	}, [formName, effectiveSnapshotsLimit])

	const ensureActiveSession = useCallback(async (): Promise<number | null> => {
		if (sessionIdRef.current !== null) {
			return sessionIdRef.current
		}
		if (ensureSessionPromiseRef.current) {
			return ensureSessionPromiseRef.current
		}

		const client = clientRef.current
		if (!client) return null

		const pending = client
			.initSession()
			.then((session) => {
				sessionIdRef.current = session.id
				setIsSubmitted(false)
				return session.id
			})
			.catch((error) => {
				logSnapshotError("Failed to initialize form snapshot session", error)
				return null
			})
			.finally(() => {
				ensureSessionPromiseRef.current = null
			})

		ensureSessionPromiseRef.current = pending
		return pending
	}, [])

	const persistCurrentSnapshot = useCallback(async () => {
		const sessionId = await ensureActiveSession()
		if (sessionId === null) return

		const client = clientRef.current
		if (!client) return

		let snapshot: FormSnapshot

		if (getValuesRef.current) {
			// Controlled / structured form — caller owns the state.
			snapshot = getValuesRef.current()
		} else {
			// Fallback: enumerate flat DOM form elements (strings / booleans only).
			const form = formRef.current
			if (!form) return
			snapshot = snapshotFromDOMForm(form)
		}

		snapshot = applyExcludeFields(snapshot, mergedExcludeFields)

		try {
			await client.saveSnapshot(sessionId, snapshot)
		} catch (error) {
			logSnapshotError("Failed to save form snapshot", error)
		}
	}, [ensureActiveSession, mergedExcludeFields])

	// ── Snapshot current form values into the active session ──────────────────
	const handleBlur = useCallback(() => {
		void persistCurrentSnapshot()
	}, [persistCurrentSnapshot])

	// ── Clear current form values after submit when requested ─────────────────
	const clearFormState = useCallback(() => {
		if (applyValuesRef.current) {
			applyValuesRef.current({} as FormSnapshot)
		} else if (formRef.current) {
			formRef.current.reset()
		}
	}, [])

	const setSessionResult = useCallback(async (result: SubmitResultMeta) => {
		const client = clientRef.current
		const sessionId = sessionIdRef.current
		if (!client || sessionId == null) return

		try {
			await client.setSubmissionResult({
				sessionId,
				statusCode: result.statusCode,
				errorMessage: result.errorMessage,
			})
		} catch (error) {
			logSnapshotError("Failed to save submission result", error)
		}
	}, [])

	const closeActiveSession = useCallback(async (): Promise<boolean> => {
		const sessionId = sessionIdRef.current
		const client = clientRef.current
		if (sessionId === null || !client) return false

		try {
			if (effectiveDiscardOnSubmit) {
				await client.deleteSession(sessionId)
				lastSubmittedSessionIdRef.current = null
			} else {
				await client.markSubmitted(sessionId)
				lastSubmittedSessionIdRef.current = sessionId
			}
			sessionIdRef.current = null
			return true
		} catch (error) {
			lastSubmittedSessionIdRef.current = null
			logSnapshotError("Failed to close form snapshot session", error)
			return false
		}
	}, [effectiveDiscardOnSubmit])

	const finalizeSuccessfulSubmit = useCallback(async () => {
		const closed = await closeActiveSession()
		if (!closed) {
			setIsSubmitted(false)
			return
		}

		if (effectiveDiscardOnSubmit) {
			clearFormState()
		}
		setIsSubmitted(true)
	}, [closeActiveSession, clearFormState, effectiveDiscardOnSubmit])

	const executeSubmit = useCallback(
		async (
			e: SyntheticEvent<HTMLFormElement>,
			userSubmit?: SubmitHandler,
			keepErrorsSilent = false,
		) => {
			e.preventDefault()
			await persistCurrentSnapshot()

			if (!userSubmit) {
				await finalizeSuccessfulSubmit()
				return
			}

			try {
				const rawResult = await userSubmit(e)
				const submitResult = toSubmitResultMeta(rawResult)
				if (submitResult) {
					await setSessionResult(submitResult)
				}

				if (isSubmitFailure(submitResult)) {
					setIsSubmitted(false)
					return
				}

				await finalizeSuccessfulSubmit()
			} catch (error) {
				setIsSubmitted(false)
				if (keepErrorsSilent) {
					// eslint-disable-next-line no-console
					console.error("wrapSubmitAsync userSubmit error:", error)
					return
				}
				throw error
			}
		},
		[persistCurrentSnapshot, finalizeSuccessfulSubmit, setSessionResult],
	)

	// ── Wrap the form's onSubmit to close the session ─────────────────────────
	const wrapSubmit = useCallback(
		(userSubmit?: SubmitHandler) =>
			async (e: SyntheticEvent<HTMLFormElement>) => {
				await executeSubmit(e, userSubmit, false)
			},
		[executeSubmit],
	)

	const markSubmitResult = useCallback(
		async (params: {
			statusCode?: number | null
			errorMessage?: string | null
		}) => {
			const client = clientRef.current
			const sessionId =
				sessionIdRef.current ?? lastSubmittedSessionIdRef.current
			if (!client || sessionId == null) return

			try {
				await client.setSubmissionResult({
					sessionId,
					statusCode: params.statusCode,
					errorMessage: params.errorMessage,
				})
			} catch (error) {
				logSnapshotError("Failed to mark submit result", error)
			}
		},
		[],
	)

	const wrapSubmitAsync = useCallback(
		(userSubmit?: SubmitHandler) =>
			async (e: SyntheticEvent<HTMLFormElement>) => {
				await executeSubmit(e, userSubmit, true)
			},
		[executeSubmit],
	)

	// ── Restore the latest saved snapshot into the form ───────────────────────
	const restoreLatest = useCallback(async () => {
		const client = clientRef.current
		if (!client) return

		const snapshot = await client.getLatestSnapshot()
		if (!snapshot) return

		if (applyValuesRef.current) {
			applyValuesRef.current(snapshot)
		} else if (formRef.current) {
			restoreSnapshotToForm(formRef.current, snapshot)
		}

		// Open a new session pre-seeded with the restored data so further edits
		// are tracked against the fresh session.
		const newSession = await client.openNewSessionFromSnapshot(snapshot)
		sessionIdRef.current = newSession.id

		setIsSubmitted(false)
	}, [])

	return {
		formRef,
		handleBlur,
		wrapSubmit,
		wrapSubmitAsync,
		restoreLatest,
		isSubmitted,
		markSubmitResult,
	}
}

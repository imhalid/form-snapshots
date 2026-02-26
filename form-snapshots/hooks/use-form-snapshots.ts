import {
	useCallback,
	useEffect,
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

			if (value && typeof value === "object" && !Array.isArray(value)) {
				result[key] = pruneByPrefix(
					value as FormSnapshot,
					paths,
					path,
				)
				continue
			}

			// For now, arrays are treated as atomic: you can exclude the whole
			// array field with its path, but not individual items.
			result[key] = value
		}

		return result
	}

	return pruneByPrefix(snapshot, excludeFields)
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

	const mergedExcludeFields =
		globalExcludeFields || excludeFields
			? Array.from(
					new Set([...(globalExcludeFields ?? []), ...(excludeFields ?? [])]),
				)
			: undefined

	// Keep latest callbacks in refs so they never invalidate the init effect
	const getValuesRef = useRef(getValues)
	const applyValuesRef = useRef(applyValues)
	useEffect(() => { getValuesRef.current = getValues }, [getValues])
	useEffect(() => { applyValuesRef.current = applyValues }, [applyValues])

	// ── Initialise: create client, prune, resume or open session ───────────────
	useEffect(() => {
		let cancelled = false

		async function init() {
			if (!storageRef.current) {
				storageRef.current = new DexieFormSnapshotsStorage()
			}

			const client = new FormSnapshotsClient({
				storage: storageRef.current!,
				formName,
				snapshotsLimit: effectiveSnapshotsLimit,
			})

			clientRef.current = client

			const session = await client.initSession()
			if (cancelled) return

			sessionIdRef.current = session.id

			// Restore saved values (after mount) via applyValues callback when
			// provided, or fall back to DOM-based restoration for flat forms.
			if (session.data && session.data !== "{}") {
				requestAnimationFrame(() => {
					if (cancelled) return
					const snapshot = JSON.parse(session.data) as FormSnapshot
					if (applyValuesRef.current) {
						applyValuesRef.current(snapshot)
					} else if (formRef.current) {
						restoreSnapshotToForm(formRef.current, snapshot)
					}
				})
			}
		}

		init()

		return () => {
			cancelled = true
		}
	}, [formName, effectiveSnapshotsLimit])

	// ── Snapshot current form values into the active session ──────────────────
	const handleBlur = useCallback(() => {
		const sessionId = sessionIdRef.current
		if (sessionId === null) return

		let snapshot: FormSnapshot

		if (getValuesRef.current) {
			// Controlled / structured form — caller owns the state.
			// Supports arbitrarily nested values: HL7 Address, HumanName,
			// ContactPoint[], CodeableConcept, etc.
			snapshot = getValuesRef.current()
		} else {
			// Fallback: enumerate flat DOM form elements (strings / booleans only).
			const form = formRef.current
			if (!form) return
			snapshot = snapshotFromDOMForm(form)
		}

		snapshot = applyExcludeFields(snapshot, mergedExcludeFields)

		if (!clientRef.current) return

		clientRef.current.saveSnapshot(sessionId, snapshot)
	}, []) // getValues is read via ref — no dep needed

	// ── Clear current form values after submit when requested ─────────────────
	const clearFormState = useCallback(() => {
		if (applyValuesRef.current) {
			// For controlled / structured forms, an empty snapshot is passed
			// back to the caller so they can reset their own state.
			applyValuesRef.current({} as FormSnapshot)
		} else if (formRef.current) {
			// For plain DOM forms, reset back to the initial values.
			formRef.current.reset()
		}
	}, [])

	// ── Wrap the form's onSubmit to close the session ─────────────────────────
	const wrapSubmit = useCallback(
		(
			userSubmit?: (e: SyntheticEvent<HTMLFormElement>) => void,
		) =>
			(e: SyntheticEvent<HTMLFormElement>) => {
				e.preventDefault()
				handleBlur() // capture the final state before closing

				const sessionId = sessionIdRef.current
				const client = clientRef.current
				if (sessionId !== null && client) {
					if (effectiveDiscardOnSubmit) {
						// Discard the entire session so submitted data is not kept.
						client.deleteSession(sessionId)
						lastSubmittedSessionIdRef.current = null
					} else {
						client.markSubmitted(sessionId)
						lastSubmittedSessionIdRef.current = sessionId
					}
					// Closed session should no longer receive snapshots
					sessionIdRef.current = null
				}

				if (effectiveDiscardOnSubmit) {
					clearFormState()
				}

				setIsSubmitted(true)
				userSubmit?.(e)
			},
		[handleBlur, clearFormState, effectiveDiscardOnSubmit],
	)

	const markSubmitResult = useCallback(
		async (params: {
			statusCode?: number | null
			errorMessage?: string | null
		}) => {
			const client = clientRef.current
			const sessionId = lastSubmittedSessionIdRef.current
			if (!client || sessionId == null) return

			await client.setSubmissionResult({
				sessionId,
				statusCode: params.statusCode,
				errorMessage: params.errorMessage,
			})
		},
		[],
	)

	const wrapSubmitAsync = useCallback(
		(
				userSubmit?: (
					e: SyntheticEvent<HTMLFormElement>,
				) => Promise<
					| void
					| {
							statusCode?: number | null
							errorMessage?: string | null
					  }
				>,
			) =>
			async (e: SyntheticEvent<HTMLFormElement>) => {
				e.preventDefault()
				handleBlur()

				const sessionId = sessionIdRef.current
				const client = clientRef.current
				if (sessionId !== null && client) {
					if (effectiveDiscardOnSubmit) {
						await client.deleteSession(sessionId)
						lastSubmittedSessionIdRef.current = null
					} else {
						await client.markSubmitted(sessionId)
						lastSubmittedSessionIdRef.current = sessionId
					}
					sessionIdRef.current = null
				}

				if (effectiveDiscardOnSubmit) {
					clearFormState()
				}

				setIsSubmitted(true)

				if (!userSubmit) return

				try {
					const result = await userSubmit(e)
					if (result && typeof result === "object") {
						await markSubmitResult({
							statusCode: "statusCode" in result ? result.statusCode : null,
							errorMessage:
								"errorMessage" in result ? result.errorMessage : null,
						})
					}
				} catch (error) {
			// In case of error we leave handling to the caller;
			// logging here is enough. Callers can still invoke
			// markSubmitResult manually if they want.
					// eslint-disable-next-line no-console
					console.error("wrapSubmitAsync userSubmit error:", error)
				}
			},
		[handleBlur, markSubmitResult, clearFormState, effectiveDiscardOnSubmit],
	)

	// ── Restore the latest saved snapshot into the DOM form ───────────────────
	const restoreLatest = useCallback(async () => {
		if (!clientRef.current) return

		const snapshot = await clientRef.current.getLatestSnapshot()
		if (!snapshot) return

		if (applyValuesRef.current) {
			// Structured form — route the full nested snapshot back to state.
			applyValuesRef.current(snapshot)
		} else {
			if (!formRef.current) return
			restoreSnapshotToForm(formRef.current, snapshot)
		}

		// Open a new session pre-seeded with the restored data so further edits
		// are tracked against the fresh session
		const newSession = await clientRef.current.openNewSessionFromSnapshot(
			snapshot,
		)
		sessionIdRef.current = newSession.id

		setIsSubmitted(false)
	}, []) // applyValues is read via ref — no dep needed

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

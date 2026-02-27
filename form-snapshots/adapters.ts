import { useFormSnapshots, type FormSnapshotsOptions } from "./hooks/use-form-snapshots"

type WithoutSnapshotOverrides = Omit<
	FormSnapshotsOptions,
	"getValues" | "applyValues"
>

export interface RHFSnapshotsOptions extends WithoutSnapshotOverrides {}

/**
 * Minimal subset of a React Hook Form instance that this library needs.
 * Kept structural so consumers are not forced to install `react-hook-form`.
 */
export interface RHFFormLike<TFieldValues extends Record<string, unknown>> {
	getValues: () => TFieldValues
	reset: (values: TFieldValues) => void
}

export function useRHFFormSnapshots<TFieldValues extends Record<string, unknown>>(
	formName: string,
	form: RHFFormLike<TFieldValues>,
	options?: RHFSnapshotsOptions,
) {
	return useFormSnapshots(formName, {
		...options,
		getValues: () => form.getValues() as Record<string, unknown>,
		applyValues: (snap) => form.reset(snap as TFieldValues),
	})
}

export interface ObjectStateSnapshotsOptions
	extends WithoutSnapshotOverrides {}

export function useObjectFormSnapshots<TState extends Record<string, unknown>>(
	formName: string,
	state: TState,
	setState: (next: TState) => void,
	options?: ObjectStateSnapshotsOptions,
) {
	return useFormSnapshots(formName, {
		...options,
		getValues: () => state as Record<string, unknown>,
		applyValues: (snap) => setState(snap as TState),
	})
}


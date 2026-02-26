import type { UseFormReturn } from "react-hook-form"
import { useFormSnapshots, type FormSnapshotsOptions } from "./hooks/use-form-snapshots"

type WithoutSnapshotOverrides = Omit<
	FormSnapshotsOptions,
	"getValues" | "applyValues"
>

export interface RHFSnapshotsOptions extends WithoutSnapshotOverrides {}

export function useRHFFormSnapshots<TFieldValues extends Record<string, unknown>>(
	formName: string,
	form: UseFormReturn<TFieldValues>,
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


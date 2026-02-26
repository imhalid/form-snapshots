import type { ReactNode } from "react"
import { createContext, useContext } from "react"

export interface FormSnapshotsGlobalConfig {
	defaultSnapshotsLimit?: number
	/**
	 * Field paths (path/prefix) to exclude while saving snapshots.
	 * E.g. ["password", "patient.address"]
	 */
	excludeFields?: string[]

	/**
	 * When true, submitted sessions are discarded and the form is cleared
	 * immediately after submit instead of keeping the data in history.
	 * Can be overridden per form via hook options.
	 */
	discardOnSubmit?: boolean
}

const FormSnapshotsConfigContext = createContext<FormSnapshotsGlobalConfig | undefined>(
	undefined,
)

export interface FormSnapshotsProviderProps {
	value?: FormSnapshotsGlobalConfig
	children: ReactNode
}

export function FormSnapshotsProvider({
	value,
	children,
}: Readonly<FormSnapshotsProviderProps>) {
	return (
		<FormSnapshotsConfigContext.Provider value={value ?? {}}>
			{children}
		</FormSnapshotsConfigContext.Provider>
	)
}

export function useFormSnapshotsConfig(): FormSnapshotsGlobalConfig {
	return useContext(FormSnapshotsConfigContext) ?? {}
}


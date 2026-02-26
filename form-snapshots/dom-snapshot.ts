type AnyFormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function toStringValue(val: unknown): string {
	if (val == null) return ""
	if (typeof val === "object") return JSON.stringify(val)
	return String(val as string | number | boolean | bigint)
}

function applyValueToInput(input: AnyFormEl, val: unknown): void {
	if (input instanceof HTMLInputElement) {
		if (input.type === "checkbox") {
			input.checked = Boolean(val)
			input.dispatchEvent(new Event("change", { bubbles: true }))
			return
		}
		if (input.type === "radio") {
			input.checked = input.value === val
			if (input.checked) input.dispatchEvent(new Event("change", { bubbles: true }))
			return
		}
	}
	input.value = toStringValue(val)
	input.dispatchEvent(new Event("input", { bubbles: true }))
}

/** Populate DOM form elements from a plain snapshot object */
export function restoreSnapshotToForm(
	form: HTMLFormElement,
	snapshot: Record<string, unknown>,
) {
	for (const el of Array.from(form.elements)) {
		const input = el as AnyFormEl
		if (!input.name || !(input.name in snapshot)) continue
		applyValueToInput(input, snapshot[input.name])
	}
}

/** Read all named fields from a plain DOM form into a flat snapshot object */
export function snapshotFromDOMForm(
	form: HTMLFormElement,
): Record<string, unknown> {
	const snapshot: Record<string, unknown> = {}
	for (const el of Array.from(form.elements)) {
		const input = el as AnyFormEl
		if (!input.name) continue
		readInputIntoSnapshot(input, snapshot)
	}
	return snapshot
}

export function readInputIntoSnapshot(
	input: AnyFormEl,
	snapshot: Record<string, unknown>,
) {
	if (input instanceof HTMLInputElement) {
		if (input.type === "checkbox") {
			snapshot[input.name] = input.checked
		} else if (input.type === "radio") {
			if (input.checked) snapshot[input.name] = input.value
		} else if (input.type !== "file") {
			snapshot[input.name] = input.value
		}
	} else {
		snapshot[input.name] = input.value
	}
}


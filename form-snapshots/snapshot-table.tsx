import { useMemo } from "react"
import { ensureFormSnapshotsStyles } from "./styles"

type Primitive = string | number | boolean | null | undefined

function isPrimitive(val: unknown): val is Primitive {
	return (
		val === null ||
		val === undefined ||
		typeof val === "string" ||
		typeof val === "number" ||
		typeof val === "boolean"
	)
}

export interface FormSnapshotTableProps {
	/**
	 * JSON-stringified snapshot. Genellikle `FormSession.data`.
	 */
	data: string
	/**
	 * Message to display when the table is empty.
	 * Default: "No data captured yet."
	 */
	emptyMessage?: string
	/**
	 * Extra class names for the outer wrapper.
	 */
	className?: string
}

type ParsedSnapshot = {
	snapshot: Record<string, unknown>
	fieldCount: number
}

const snapshotCache = new Map<string, ParsedSnapshot>()

function parseSnapshot(data: string): ParsedSnapshot {
	const cached = snapshotCache.get(data)
	if (cached) return cached

	let snapshot: Record<string, unknown> = {}
	try {
		snapshot = JSON.parse(data) as Record<string, unknown>
	} catch {
		snapshot = {}
	}

	const parsed = {
		snapshot,
		fieldCount: Object.keys(snapshot).length,
	}

	snapshotCache.set(data, parsed)
	return parsed
}

export function FormSnapshotTable({
	data,
	emptyMessage = "No data captured yet.",
	className,
}: Readonly<FormSnapshotTableProps>) {
	ensureFormSnapshotsStyles()

	const { snapshot, fieldCount } = useMemo(() => parseSnapshot(data), [data])

	if (fieldCount === 0) {
		return (
			<p className="fs-snapshot-empty">
				{emptyMessage}
			</p>
		)
	}

	return (
		<div
			className={[
				"fs-snapshot-wrapper",
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			<table className="fs-snapshot-table">
				<thead>
					<tr className="fs-snapshot-header-row">
						<th className="fs-snapshot-header-cell">
							Field
						</th>
						<th className="fs-snapshot-header-cell">
							Value
						</th>
					</tr>
				</thead>
				<tbody>
					{Object.entries(snapshot).map(([key, value]) => (
						<tr
							key={key}
							className="fs-snapshot-row"
						>
							<td className="fs-snapshot-key">
								{key}
							</td>
							<td className="fs-snapshot-value">
								<SnapshotValueCell value={value} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function SnapshotValueCell({ value }: Readonly<{ value: unknown }>) {
	if (isPrimitive(value)) {
		if (value === null || value === undefined || value === "") {
			return (
				<span className="fs-snapshot-muted">
					—
				</span>
			)
		}

		if (typeof value === "boolean") {
			return (
				<span
					className={
						value
							? "fs-snapshot-badge fs-snapshot-badge-true"
							: "fs-snapshot-badge fs-snapshot-badge-false"
					}
				>
					{String(value)}
				</span>
			)
		}

		return <span className="fs-snapshot-text">{String(value)}</span>
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return (
				<span className="fs-snapshot-muted">
					—
				</span>
			)
		}

		return (
			<div className="fs-snapshot-array">
				{value.map((v, idx) => (
					// eslint-disable-next-line react/no-array-index-key
					<span
						key={idx}
						className="fs-snapshot-chip"
					>
						{String(v)}
					</span>
				))}
			</div>
		)
	}

	return (
		<pre className="fs-snapshot-object">
			{JSON.stringify(value, null, 2)}
		</pre>
	)
}


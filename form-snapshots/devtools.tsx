import { useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, type FormSession } from "./local-db/db"
import { FormSnapshotTable } from "./snapshot-table"
import { ensureFormSnapshotsStyles } from "./styles"

function formatDateShort(ms: number) {
	return new Intl.DateTimeFormat("en-GB", {
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(ms))
}

function formatAge(ms: number) {
	const seconds = Math.floor(ms / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)

	if (days > 0) return `${days}d ${hours % 24}h`
	if (hours > 0) return `${hours}h ${minutes % 60}m`
	if (minutes > 0) return `${minutes}m`
	return `${seconds}s`
}

type GlobalWithNodeEnv = typeof globalThis & {
	process?: { env?: { NODE_ENV?: string } }
}

function isLocalHostname(hostname: string): boolean {
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "::1" ||
		hostname.endsWith(".local")
	)
}

function inferProductionFromLocation() {
	if (typeof window === "undefined") return false
	return !isLocalHostname(window.location.hostname)
}

function isProductionRuntime(override?: boolean) {
	if (typeof override === "boolean") return override

	const nodeEnv = (globalThis as GlobalWithNodeEnv).process?.env?.NODE_ENV
	if (typeof nodeEnv === "string" && nodeEnv.length > 0) {
		return nodeEnv === "production"
	}

	return inferProductionFromLocation()
}

export interface FormSnapshotsDevtoolsProps {
	/**
	 * Optional runtime override for environment detection.
	 * Use `import.meta.env.PROD` in Vite-based apps if needed.
	 */
	isProduction?: boolean
}

export function FormSnapshotsDevtools({
	isProduction,
}: Readonly<FormSnapshotsDevtoolsProps> = {}) {
	ensureFormSnapshotsStyles()

	const isProd = isProductionRuntime(isProduction)

	if (isProd) {
		return null
	}

	const [open, setOpen] = useState(false)
	const [selectedForm, setSelectedForm] = useState<string>("all")
	const [onlySubmitted, setOnlySubmitted] = useState(false)
	const [onlyErrors, setOnlyErrors] = useState(false)
	const [expandedId, setExpandedId] = useState<number | null>(null)
	const [isClearing, setIsClearing] = useState(false)

	const sessions = useLiveQuery<FormSession[]>(() => {
		return db.formSessions
			.toCollection()
			.sortBy("updatedAt")
			.then((all) => all.reverse())
	}, [])

	const now = Date.now()

	const formNames = useMemo(() => {
		if (!sessions) return []
		return Array.from(new Set(sessions.map((s) => s.formName))).sort()
	}, [sessions])

	const filtered = useMemo(() => {
		if (!sessions) return []

		return sessions.filter((s) => {
			if (selectedForm !== "all" && s.formName !== selectedForm) {
				return false
			}
			if (onlySubmitted && !s.submitted) {
				return false
			}
			if (onlyErrors && (s.statusCode == null || s.statusCode < 400)) {
				return false
			}
			return true
		})
	}, [sessions, selectedForm, onlySubmitted, onlyErrors])

	const handleDeleteSession = async (id: number) => {
		try {
			await db.formSessions.delete(id)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Failed to delete form session", error)
		}
	}

	const handleClearAll = async () => {
		if (!sessions || sessions.length === 0) return
		setIsClearing(true)
		try {
			const ids = sessions.map((s) => s.id)
			await db.formSessions.bulkDelete(ids)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Failed to clear form sessions", error)
		} finally {
			setIsClearing(false)
		}
	}

	const total = sessions?.length ?? 0

	if (!sessions || sessions.length === 0) {
		return null
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
					className="fs-devtools-toggle"
			>
					<HistoryIcon style={{ width: 12, height: 12 }} />
				<span>Form Snapshot Devtools</span>
				{total > 0 && (
						<span className="fs-devtools-toggle-count">
						{total}
					</span>
				)}
			</button>

			{open && (
				<div className="fs-devtools-panel">
					<div className="fs-devtools-header">
						<div className="fs-devtools-header-left">
							<HistoryIcon style={{ width: 14, height: 14 }} />
							<div className="fs-devtools-header-text">
								<span className="fs-devtools-header-title">
									Form Snapshot Devtools
								</span>
								<span className="fs-devtools-header-subtitle">
									{filtered.length} / {total} session
								</span>
							</div>
						</div>
						<div className="fs-devtools-header-actions">
							<button
								type="button"
								onClick={handleClearAll}
								className="fs-devtools-clear"
								disabled={isClearing || !sessions || sessions.length === 0}
							>
								Clear all
							</button>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="fs-devtools-close"
							>
								<XIcon style={{ width: 12, height: 12 }} />
							</button>
						</div>
					</div>

					<div className="fs-devtools-filters">
						<FilterIcon style={{ width: 12, height: 12 }} />
						<select
							className="fs-devtools-select"
							value={selectedForm}
							onChange={(e) => setSelectedForm(e.target.value)}
						>
							<option value="all">All forms</option>
							{formNames.map((name) => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</select>
						<label className="fs-devtools-filter-label">
							<input
								type="checkbox"
								checked={onlySubmitted}
								onChange={(e) => setOnlySubmitted(e.target.checked)}
							/>
							<span>submitted</span>
						</label>
						<label className="fs-devtools-filter-label">
							<input
								type="checkbox"
								checked={onlyErrors}
								onChange={(e) => setOnlyErrors(e.target.checked)}
							/>
							<span>errors</span>
						</label>
					</div>

					<div className="fs-devtools-body">
						{filtered.length === 0 ? (
							<p className="fs-devtools-empty">
								No sessions match the selected filters.
							</p>
						) : (
							<ul className="fs-devtools-list">
								{filtered.map((s) => (
									<li
										key={s.id}
										className="fs-devtools-item"
									>
										<button
											type="button"
											onClick={() =>
												setExpandedId((current) =>
													current === s.id ? null : s.id,
												)
											}
											className="fs-devtools-item-toggle"
										>
											<div className="fs-devtools-item-main">
												<ChevronDownIcon
													style={{
														width: 12,
														height: 12,
														transform:
															expandedId === s.id
																? "rotate(0deg)"
																: "rotate(-90deg)",
														transition: "transform 120ms ease-out",
													}}
												/>
												<div className="fs-devtools-item-text">
													<div className="fs-devtools-item-tags">
														<span className="fs-devtools-tag">
															{s.formName}
														</span>
														<span className="fs-devtools-id">
															#{s.id}
														</span>
													</div>
													<div className="fs-devtools-meta">
														<span>{formatDateShort(s.updatedAt)}</span>
														<span>· {formatAge(now - s.updatedAt)} ago</span>
														{s.submitted ? (
															<span className="fs-devtools-badge fs-devtools-badge-success">
																submitted
															</span>
														) : (
															<span className="fs-devtools-badge fs-devtools-badge-warn">
																in progress
															</span>
														)}
														{s.statusCode != null && (
															<span className="fs-devtools-status">
																status {s.statusCode}
															</span>
														)}
														<button
															type="button"
															className="fs-devtools-delete"
															onClick={(e) => {
																e.stopPropagation()
																void handleDeleteSession(s.id)
															}}
														>
															Delete
														</button>
													</div>
												</div>
											</div>
											{typeof s.errorMessage === "string" && s.errorMessage && (
												<div className="fs-devtools-error">
													{s.errorMessage}
												</div>
											)}
										</button>

										{expandedId === s.id && (
											<div className="fs-devtools-snapshot">
												<FormSnapshotTable
													data={s.data}
													emptyMessage="This session does not contain any field data yet."
												/>
											</div>
										)}
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			)}
		</>
	)
}

type IconProps = React.SVGProps<SVGSVGElement>

function HistoryIcon(props: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<path d="M3 3v6h6" />
			<path d="M3.05 13A9 9 0 1 0 9 3.05" />
			<path d="M12 7v5l3 3" />
		</svg>
	)
}

function XIcon(props: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	)
}

function FilterIcon(props: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
		</svg>
	)
}

function ChevronDownIcon(props: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<polyline points="6 9 12 15 18 9" />
		</svg>
	)
}

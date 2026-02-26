const STYLE_ID = "form-snapshots-styles"

const SNAPSHOT_TABLE_CSS = `:root {
  /* light – neutral-like palette */
  --fs-st-border: #e5e5e5;           /* neutral-200 */
  --fs-st-border-soft: #d4d4d4;      /* neutral-300 */
  --fs-st-header-bg: #f5f5f5;        /* neutral-100 */
  --fs-st-key-text: #737373;         /* neutral-500 */
  --fs-st-muted-text: #737373;       /* neutral-500 */
  --fs-st-muted-strong: #a3a3a3;     /* neutral-400 */
  --fs-st-chip-bg: #e5e5e5;          /* neutral-200 */
  --fs-st-chip-text: #171717;        /* neutral-900 */
  --fs-st-object-bg: #f5f5f5;        /* neutral-100 */
  --fs-st-badge-true-bg: rgba(22, 163, 74, 0.1);
  --fs-st-badge-true-text: #166534;
  --fs-st-badge-false-border: #d4d4d4;
  --fs-st-badge-false-text: #525252; /* neutral-600 */
  --fs-st-text-main: #171717;        /* neutral-900 */
}

html.dark {
  /* dark – neutral-900/950 style */
  --fs-st-border: #404040;           /* neutral-700 */
  --fs-st-border-soft: #262626;      /* neutral-800 */
  --fs-st-header-bg: #171717;        /* neutral-900 */
  --fs-st-key-text: #a3a3a3;         /* neutral-400 */
  --fs-st-muted-text: #a3a3a3;       /* neutral-400 */
  --fs-st-muted-strong: #737373;     /* neutral-500 */
  --fs-st-chip-bg: #262626;          /* neutral-800 */
  --fs-st-chip-text: #f5f5f5;        /* neutral-100 */
  --fs-st-object-bg: #0a0a0a;        /* neutral-950ish */
  --fs-st-badge-true-bg: rgba(22, 163, 74, 0.25);
  --fs-st-badge-true-text: #bbf7d0;
  --fs-st-badge-false-border: #404040;
  --fs-st-badge-false-text: #e5e5e5; /* neutral-200 */
  --fs-st-text-main: #f5f5f5;        /* neutral-100 */
}
.fs-snapshot-wrapper {
  border-radius: 6px;
  border: 1px solid var(--fs-st-border);
  overflow: hidden;
  color: var(--fs-st-text-main);
}

.fs-snapshot-table {
  width: 100%;
  font-size: 12px;
  border-collapse: collapse;
}

.fs-snapshot-header-row {
  border-bottom: 1px solid var(--fs-st-border);
  background: var(--fs-st-header-bg);
}

.fs-snapshot-header-cell {
  padding: 4px 6px;
  text-align: left;
  font-weight: 500;
  color: var(--fs-st-muted-text);
}

.fs-snapshot-row {
  border-bottom: 1px solid var(--fs-st-border-soft);
}

.fs-snapshot-row:last-child {
  border-bottom: none;
}

.fs-snapshot-key {
  padding: 4px 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 10px;
  color: var(--fs-st-key-text);
  vertical-align: top;
}

.fs-snapshot-value {
  padding: 4px 6px;
  vertical-align: top;
}

.fs-snapshot-empty {
  font-size: 12px;
  color: var(--fs-st-muted-text);
  font-style: italic;
}

.fs-snapshot-muted {
  color: var(--fs-st-muted-strong);
  font-style: italic;
}

.fs-snapshot-text {
  word-break: break-all;
}

.fs-snapshot-array {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.fs-snapshot-chip {
  background: var(--fs-st-chip-bg);
  color: var(--fs-st-chip-text);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
}

.fs-snapshot-object {
  max-height: 128px;
  overflow: auto;
  border-radius: 4px;
  background: var(--fs-st-object-bg);
  padding: 4px;
  font-size: 10px;
}

.fs-snapshot-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 10px;
}

.fs-snapshot-badge-true {
  background: var(--fs-st-badge-true-bg);
  color: var(--fs-st-badge-true-text);
}

.fs-snapshot-badge-false {
  background: transparent;
  color: var(--fs-st-badge-false-text);
  border: 1px solid var(--fs-st-badge-false-border);
}
`

const DEVTOOLS_CSS = `:root {
  /* light mode – Tailwind neutral-ish */
  --fs-dev-bg-surface: rgba(250, 250, 250, 0.95); /* neutral-50 */
  --fs-dev-bg-panel: rgba(250, 250, 250, 0.98);   /* neutral-50 */
  --fs-dev-bg-header: #f5f5f5;                    /* neutral-100 */
  --fs-dev-bg-header-muted: #f5f5f5;
  --fs-dev-bg-toggle-count: #e5e5e5;              /* neutral-200 */
  --fs-dev-bg-close-hover: #e5e5e5;               /* neutral-200 */
  --fs-dev-bg-tag: #e5e5e5;                       /* neutral-200 */
  --fs-dev-bg-status: #e5e5e5;                    /* neutral-200 */
  --fs-dev-bg-snapshot: #f5f5f5;                  /* neutral-100 */

  --fs-dev-border-strong: #e5e5e5;                /* neutral-200 */
  --fs-dev-border-subtle: #e5e5e5;                /* neutral-200 */
  --fs-dev-border-soft: #d4d4d4;                  /* neutral-300 */
  --fs-dev-border-snapshot: #d4d4d4;              /* neutral-300 */

  --fs-dev-text-primary: #171717;                 /* neutral-900 */
  --fs-dev-text-muted: #737373;                   /* neutral-500 */
  --fs-dev-text-soft: #525252;                    /* neutral-600 */
  --fs-dev-text-error: #b91c1c;

  --fs-dev-badge-success-bg: rgba(22, 163, 74, 0.1);
  --fs-dev-badge-success-text: #166534;
  --fs-dev-badge-warn-bg: rgba(217, 119, 6, 0.12);
  --fs-dev-badge-warn-text: #92400e;

  --fs-dev-shadow-toggle: 0 1px 3px rgba(0, 0, 0, 0.08);
  --fs-dev-shadow-toggle-hover: 0 2px 6px rgba(0, 0, 0, 0.12);
  --fs-dev-shadow-panel: 0 8px 24px rgba(0, 0, 0, 0.12);
}

html.dark .fs-color-scheme-root:root,
html.dark {
  /* dark mode – neutral-900/950 style */
  --fs-dev-bg-surface: rgba(23, 23, 23, 0.95);    /* neutral-900 */
  --fs-dev-bg-panel: rgba(23, 23, 23, 0.98);      /* neutral-900 */
  --fs-dev-bg-header: #171717;                    /* neutral-900 */
  --fs-dev-bg-header-muted: #171717;
  --fs-dev-bg-toggle-count: #262626;              /* neutral-800 */
  --fs-dev-bg-close-hover: #404040;              /* neutral-700 */
  --fs-dev-bg-tag: #262626;                       /* neutral-800 */
  --fs-dev-bg-status: #171717;                    /* neutral-900 */
  --fs-dev-bg-snapshot: #0a0a0a;                  /* neutral-950ish */

  --fs-dev-border-strong: #404040;                /* neutral-700 */
  --fs-dev-border-subtle: #262626;                /* neutral-800 */
  --fs-dev-border-soft: #262626;                  /* neutral-800 */
  --fs-dev-border-snapshot: #404040;              /* neutral-700 */

  --fs-dev-text-primary: #fafafa;                 /* neutral-50 */
  --fs-dev-text-muted: #a3a3a3;                   /* neutral-400 */
  --fs-dev-text-soft: #d4d4d4;                    /* neutral-300 */
  --fs-dev-text-error: #fecaca;

  --fs-dev-badge-success-bg: rgba(22, 163, 74, 0.25);
  --fs-dev-badge-success-text: #bbf7d0;
  --fs-dev-badge-warn-bg: rgba(217, 119, 6, 0.3);
  --fs-dev-badge-warn-text: #fed7aa;

  --fs-dev-shadow-toggle: 0 1px 3px rgba(0, 0, 0, 0.6);
  --fs-dev-shadow-toggle-hover: 0 2px 6px rgba(0, 0, 0, 0.7);
  --fs-dev-shadow-panel: 0 20px 40px rgba(0, 0, 0, 0.8);
}
.fs-devtools-toggle {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  border: 1px solid var(--fs-dev-border-strong);
  background: var(--fs-dev-bg-surface);
  padding: 4px 8px;
  font-size: 12px;
  color: var(--fs-dev-text-soft);
  box-shadow: var(--fs-dev-shadow-toggle);
  cursor: pointer;
}

.fs-devtools-toggle:hover {
  box-shadow: var(--fs-dev-shadow-toggle-hover);
  color: var(--fs-dev-text-primary);
}

.fs-devtools-toggle-count {
  margin-left: 4px;
  border-radius: 999px;
  background: var(--fs-dev-bg-toggle-count);
  padding: 0 4px;
  font-size: 10px;
  color: var(--fs-dev-text-primary);
}

.fs-devtools-panel {
  position: fixed;
  bottom: 56px;
  overflow: hidden;
  right: 16px;
  z-index: 9999;
  width: 420px;
  max-height: 60vh;
  border-radius: 12px;
  color: var(--fs-dev-text-primary);
  border: 1px solid var(--fs-dev-border-strong);
  background: var(--fs-dev-bg-panel);
  box-shadow: var(--fs-dev-shadow-panel);
  display: flex;
  flex-direction: column;
  font-size: 14px;
}

.fs-devtools-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid var(--fs-dev-border-subtle);
  background: var(--fs-dev-bg-header);
}

.fs-devtools-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.fs-devtools-header-text {
  display: flex;
  flex-direction: column;
}

.fs-devtools-header-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--fs-dev-text-primary);
}

.fs-devtools-header-subtitle {
  font-size: 11px;
  color: var(--fs-dev-text-muted);
}

.fs-devtools-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fs-devtools-clear {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid var(--fs-dev-border-subtle);
  background: transparent;
  color: var(--fs-dev-text-muted);
  cursor: pointer;
}

.fs-devtools-clear:hover:enabled {
  background: var(--fs-dev-bg-close-hover);
  color: var(--fs-dev-text-primary);
}

.fs-devtools-clear:disabled {
  opacity: 0.5;
  cursor: default;
}

.fs-devtools-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--fs-dev-text-muted);
}

.fs-devtools-close:hover {
  background: var(--fs-dev-bg-close-hover);
  color: var(--fs-dev-text-primary);
}

.fs-devtools-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--fs-dev-border-subtle);
}

.fs-devtools-select {
  flex: 1;
  border-radius: 4px;
  border: 1px solid var(--fs-dev-border-strong);
  background: var(--fs-dev-bg-panel);
  padding: 2px 6px;
  font-size: 12px;
}

.fs-devtools-filter-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--fs-dev-text-muted);
}

.fs-devtools-body {
  flex: 1;
  overflow: auto;
}

.fs-devtools-empty {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--fs-dev-text-muted);
}

.fs-devtools-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--fs-dev-border-soft);
}

.fs-devtools-item {
  padding: 6px 8px;
  border-bottom: 1px solid var(--fs-dev-border-soft);
}

.fs-devtools-item-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.fs-devtools-item-main {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.fs-devtools-item-text {
  min-width: 0;
}

.fs-devtools-item-tags {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fs-devtools-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--fs-dev-bg-tag);
  padding: 2px 6px;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  color: var(--fs-dev-text-primary);
}

.fs-devtools-id {
  font-size: 10px;
  color: var(--fs-dev-text-muted);
}

.fs-devtools-meta {
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--fs-dev-text-muted);
}

.fs-devtools-delete {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 11px;
  color: var(--fs-dev-text-soft);
  cursor: pointer;
}

.fs-devtools-delete:hover {
  text-decoration: underline;
  color: var(--fs-dev-text-primary);
}

.fs-devtools-badge {
  border-radius: 999px;
  padding: 2px 6px;
  font-size: 10px;
}

.fs-devtools-badge-success {
  background: var(--fs-dev-badge-success-bg);
  color: var(--fs-dev-badge-success-text);
}

.fs-devtools-badge-warn {
  background: var(--fs-dev-badge-warn-bg);
  color: var(--fs-dev-badge-warn-text);
}

.fs-devtools-status {
  border-radius: 999px;
  background: var(--fs-dev-bg-status);
  padding: 2px 6px;
  font-size: 10px;
  color: var(--fs-dev-text-primary);
}

.fs-devtools-error {
  margin-left: 8px;
  max-width: 40%;
  font-size: 11px;
  color: var(--fs-dev-text-error);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-devtools-snapshot {
  margin-top: 6px;
  border-radius: 6px;
  background: var(--fs-dev-bg-snapshot);
  font-size: 12px;
}
`

export function ensureFormSnapshotsStyles() {
	if (typeof document === "undefined") return
	if (document.getElementById(STYLE_ID)) return

	const style = document.createElement("style")
	style.id = STYLE_ID
	style.type = "text/css"
	style.appendChild(
		document.createTextNode(`${SNAPSHOT_TABLE_CSS}\n\n${DEVTOOLS_CSS}`),
	)
	;(document.head || document.documentElement).appendChild(style)
}


## 4. Devtools & Snapshot Inspection

This page covers how to **inspect sessions and snapshot data** visually while developing.

---

### Enabling `FormSnapshotsDevtools`

Import and render `FormSnapshotsDevtools` once near the root of your app:

```tsx
import { FormSnapshotsDevtools } from "form-snapshots"

export function RootLayout() {
  return (
    <>
      {/* your app UI */}
      <FormSnapshotsDevtools />
    </>
  )
}
```

Notes:

- The devtools component automatically **injects its own styles**.
- It **does not render in production** by default (NODE_ENV + hostname detection).
- You can override detection explicitly:
  - `<FormSnapshotsDevtools isProduction={import.meta.env.PROD} />`

---

### What you see in the panel

When at least one session exists, a small **floating toggle button** appears in the bottom‑right corner:

- Clicking it opens a side panel listing form sessions.
- The badge on the toggle shows the **total number of sessions**.

Inside the panel you get:

- A header showing:
  - Total sessions.
  - Filtered sessions count.
- A filter bar with:
  - Form selector (`All forms` or a specific `formName`).
  - A checkbox to show only **submitted** sessions.
  - A checkbox to show only **error** sessions (status code ≥ 400).
- A scrollable list where each item shows:
  - `formName` and `#id`.
  - Last updated time and “time ago”.
  - Whether it’s **submitted** or **in progress**.
  - Optional `statusCode` and `errorMessage` if you call `markSubmitResult`.

You can expand any item to see the **snapshot data**.

---

### Snapshot view: `FormSnapshotTable`

The devtools use the exported `FormSnapshotTable` component to render session data.

You can also use it directly if you want to show snapshot contents in a custom UI:

```tsx
import { FormSnapshotTable } from "form-snapshots"
import type { FormSession } from "form-snapshots"

function SnapshotDebug({ session }: { session: FormSession }) {
  return (
    <FormSnapshotTable
      data={session.data} // JSON string
      emptyMessage="No fields captured yet."
    />
  )
}
```

What it does:

- Parses the JSON string with a small cache.
- Renders a two‑column table:
  - **Field**: key path.
  - **Value**: value, pretty‑printed for objects / arrays.
- Handles:
  - Booleans with badges (`true` / `false`).
  - Arrays as chips.
  - Nested objects as a small scrollable JSON block.

Use this when:

- You want a **compact read‑only view** of a snapshot in a custom admin or debug page.

---

### Managing sessions from devtools

The devtools offer a couple of convenience actions:

- **Delete a single session**:
  - Each list item has a small **Delete** action.
  - Clicking it removes that `FormSession` from IndexedDB.
- **Clear all sessions**:
  - A **Clear all** button in the header deletes all sessions currently known.
  - Useful when you want to start fresh while testing forms.

These actions only affect **local IndexedDB data** in the current browser and do not touch your backend.

---

### When to use devtools vs programmatic access

- Use **devtools** when:
  - You are **developing or debugging** and want a visual overview.
  - You need to quickly confirm that snapshots and statuses are stored as expected.
- Use **programmatic hooks** (e.g. `useFormSnapshotsList`, `FormSnapshotTable`) when:
  - You are building **product‑level UIs** for end users or internal teams.

For those programmatic APIs, also see  
[3. Configuration & Session Behaviour](./configuration.md).

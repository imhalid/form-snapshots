## 3. Configuration & Session Behaviour

This page explains how to control **retention**, **excluded fields**, and **what happens after submit**.

---

### Global configuration with `FormSnapshotsProvider`

Wrap your app (or a subtree) with `FormSnapshotsProvider` to set defaults:

```tsx
import { FormSnapshotsProvider } from "form-snapshots"

export function App() {
  return (
    <FormSnapshotsProvider
      value={{
        // Keep sessions for up to 7 days by default
        defaultSnapshotsLimit: 7 * 24 * 60 * 60 * 1000,

        // Never store these fields in snapshots
        excludeFields: ["password", "patient.ssn"],

        // Do NOT discard submitted sessions globally (per-form override possible)
        discardOnSubmit: false,
      }}
    >
      {/* your routes and pages */}
    </FormSnapshotsProvider>
  )
}
```

All options passed directly to `useFormSnapshots` (or the adapters) override these global defaults **per form**.

---

### Retention: `snapshotsLimit` / `defaultSnapshotsLimit`

Controls **how long** to keep sessions in storage.

- Global: `defaultSnapshotsLimit` in `FormSnapshotsProvider`.
- Per form: `snapshotsLimit` in the hook options.

Example:

```ts
// keep only the last 24 hours of history for this form
useFormSnapshots("contact-form", {
  snapshotsLimit: 24 * 60 * 60 * 1000,
})
```

Internally, old sessions are pruned based on their `updatedAt` timestamp.

Use this when:

- You want to **limit disk usage** in IndexedDB.
- You only care about **recent drafts** and submissions.

---

### Excluding fields: `excludeFields`

You can skip specific fields (or prefixes) from being saved into snapshots.

- Global: `excludeFields` in `FormSnapshotsProvider`.
- Per form: `excludeFields` in options.

For object‑based snapshots (RHF / object adapter), prefixes work like:

- `"patient.address"` will exclude:
  - `patient.address.street`
  - `patient.address.city`
  - `patient.address.postcode`

Example:

```ts
useFormSnapshots("patient-intake", {
  excludeFields: ["patient.secretNotes", "patient.credentials.password"],
})
```

Use this when:

- You want to avoid storing **sensitive** data in local storage.
- Certain fields are **too noisy** or not useful when restoring.

---

### Discarding data after submit: `discardOnSubmit`

Sometimes you want autosave only while the form is in progress, and you don’t want any data to remain after a successful submit.

For that, use `discardOnSubmit`.

```ts
useFormSnapshots("feedback-form", {
  discardOnSubmit: true,
})
```

Behaviour when `discardOnSubmit: true`:

- After submit, the active session is **deleted** from storage instead of being marked `submitted`.
- The form is **cleared**:
  - For DOM forms: `form.reset()` is called.
  - For controlled / structured forms: `applyValues({})` is called (or, with adapters, your state is reset).
- No submitted snapshot remains in history for that form.

Set it globally if you want this behaviour by default:

```tsx
<FormSnapshotsProvider value={{ discardOnSubmit: true }}>
  {/* ... */}
</FormSnapshotsProvider>
```

Then override on a particular form where you do want to keep history:

```ts
useFormSnapshots("admin-audit-form", { discardOnSubmit: false })
```

---

### Listing history: `useFormSnapshotsList`

You can build your own “recent sessions” or “submission history” UI using `useFormSnapshotsList`.

```tsx
import { useFormSnapshotsList } from "form-snapshots"

export function RecentSubmissions() {
  const { items, isLoading } = useFormSnapshotsList("contact-form", {
    onlySubmitted: true,
    onlySuccessful: true,
    maxAgeMs: 24 * 60 * 60 * 1000, // last 24 hours
    limit: 20,
  })

  if (isLoading) return <p>Loading…</p>
  if (!items.length) return <p>No recent submissions.</p>

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          #{item.id} —{" "}
          {new Date(item.updatedAt).toLocaleString()} — status{" "}
          {item.statusCode ?? "n/a"}
        </li>
      ))}
    </ul>
  )
}
```

Use this when:

- You want a **custom dashboard** of recent form activity.
- You want to let power users quickly re‑open previous sessions.

For inspecting the full snapshot content visually, also see  
[4. Devtools & Snapshot Inspection](./devtools.md).

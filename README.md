## form-snapshots

For a more complete, multi-page guide, see the **docs mini‑wiki** under `docs/`:

- [Documentation index](https://github.com/imhalid/form-snapshots/blob/main/docs/index.md)

**form-snapshots** is a small React library that adds **autosave + history snapshots** to your forms using **IndexedDB (Dexie)** under the hood.

It automatically stores form state while the user is typing, lets them resume unfinished forms, inspect past submissions, and debug failures, all without changing your backend.

### What this project is

- **React hooks and components** for:
  - **Autosaving** form state to the browser on blur.
  - **Restoring** the most recent snapshot back into the form.
  - **Listing** previous sessions and their metadata (status code, error message, timestamps).
  - **Devtools UI** to inspect and filter form sessions in development.
- **Storage layer** built on Dexie, so everything lives in the user’s browser (no server required).

### What it is for

- **Long or complex forms** where users might navigate away or lose their work.
- **Clinical / enterprise / back-office apps** where losing form data is painful and audit/history is important.
- **Debugging submission problems** (you can see exactly what the user had filled + status codes / errors).

---

## Installation

```bash
npm install form-snapshots
# peer deps
npm install react react-dom dexie dexie-react-hooks react-hook-form
```

Requires **React 18+**.

---

## Core concepts

- **Session**: one editing “lifetime” of a form (from first visit until successful submit).
- **Snapshot**: a JSON representation of the form values at a point in time.
- **Storage**: by default, snapshots are stored in IndexedDB via Dexie.

You identify each form by a **`formName`** string; all hooks and tools use this key to group sessions.

---

## Basic usage: `useFormSnapshots`

`useFormSnapshots` adds autosave and restore to a standard DOM form.

```tsx
import { useFormSnapshots } from "form-snapshots"

export function ContactForm() {
  const {
    formRef,
    handleBlur,
    wrapSubmit,
    restoreLatest,
    isSubmitted,
  } = useFormSnapshots("contact-form")

  const onSubmit = wrapSubmit(() => {
    // Perform your usual submit logic (fetch / mutation / etc.)
  })

  return (
    <form ref={formRef} onBlur={handleBlur} onSubmit={onSubmit}>
      <input name="fullName" placeholder="Full name" />
      <input name="email" type="email" placeholder="Email" />
      <textarea name="message" placeholder="Message" />

      <button type="submit">Send</button>

      <button
        type="button"
        onClick={restoreLatest}
        disabled={isSubmitted}
      >
        Restore last draft
      </button>
    </form>
  )
}
```

**How it works:**

- On blur, the hook reads values from the DOM and saves them to IndexedDB.
- On mount, it restores the latest snapshot (if any) back into the form.
- On submit, it captures the final state and closes the session only after a successful handler result.

### Options

```ts
useFormSnapshots("contact-form", {
  snapshotsLimit: 24 * 60 * 60 * 1000, // ms to retain history (default: 24h)
  excludeFields: ["password", "patient.ssn"], // paths to omit from snapshots
  getValues: () => snapshot,       // custom snapshot source (for controlled forms)
  applyValues: (snapshot) => {},   // custom restore logic (for controlled forms)
  discardOnSubmit: true,           // delete session + clear form after submit
})
```

Use `getValues` / `applyValues` when your form state lives in React state or is nested/structured, instead of plain DOM inputs.

---

## Global config: `FormSnapshotsProvider`

You can configure defaults once at the application root.

```tsx
import { FormSnapshotsProvider } from "form-snapshots"

function App() {
  return (
    <FormSnapshotsProvider
      value={{
        defaultSnapshotsLimit: 7 * 24 * 60 * 60 * 1000, // keep 7 days
        excludeFields: ["password", "patient.address"],
        discardOnSubmit: false, // global default, can be overridden per form
      }}
    >
      {/* your routes/components */}
    </FormSnapshotsProvider>
  )
}
```

Per-form options passed to `useFormSnapshots` are merged with this global config.

---

## Devtools: `FormSnapshotsDevtools`

`FormSnapshotsDevtools` renders a small toggle button and a side panel that shows:

- All form sessions stored locally.
- Filters by **form name**, **submitted only**, and **errors only**.
- Timestamps, relative age, status codes, and error messages.
- Inline table view of the snapshot data for each session.
- Ability to delete a single session or clear all sessions from local history (dev-only).

It automatically hides itself in production (NODE_ENV + hostname detection).  
If you need explicit control (e.g. Vite), pass `isProduction={import.meta.env.PROD}`.

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

---

## Listing history: `useFormSnapshotsList`

`useFormSnapshotsList` lets you build your own history UI for a given form.

```tsx
import { useFormSnapshotsList } from "form-snapshots"

export function RecentSubmissions() {
  const { items, isLoading } = useFormSnapshotsList("contact-form", {
    onlySubmitted: true,
    onlySuccessful: true,
    maxAgeMs: 24 * 60 * 60 * 1000, // last 24h
    limit: 20,
  })

  if (isLoading) return <p>Loading…</p>
  if (!items.length) return <p>No recent submissions.</p>

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          #{item.id} – {new Date(item.updatedAt).toLocaleString()} – status{" "}
          {item.statusCode ?? "n/a"}
        </li>
      ))}
    </ul>
  )
}
```

---

## Adapters and advanced usage

The library also exports:

- `useRHFFormSnapshots` – an adapter for **react-hook-form**.
- `useObjectFormSnapshots` – for generic object/React-state based forms.
- `FormSnapshotTable` – a table component for rendering snapshot key/value data.
- `FormSnapshotsClient` and `FormSnapshotsStorage` interfaces – if you want to plug in a custom storage backend instead of Dexie.

These build on the same concepts as `useFormSnapshots` but integrate more tightly with specific form/state libraries.

---

## Building

This package is built with **tsup** and TypeScript:

```bash
npm run build
```

The build outputs ESM, CJS, and `.d.ts` type declarations under `dist/`.

---

## License

ISC

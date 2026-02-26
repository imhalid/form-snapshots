## 1. Overview & Installation

### What is form-snapshots?

`form-snapshots` is a small React library that gives your forms:

- **Autosave**: capture form data while the user works on the form (by default when fields blur / lose focus).
- **History**: keep form “sessions” so users can resume where they left off.
- **Debug visibility**: inspect what was submitted, with status codes and error messages.

All data is stored **locally in the browser** using IndexedDB (via Dexie).  
No backend changes are required.

You should consider using this library when:

- You have **long / complex forms** where losing progress is painful.
- Users frequently **navigate away or refresh** by mistake.
- You want better visibility into **what went wrong** when submissions fail.

---

### Core concepts

- **Form name (`formName`)**: a string identifier per form (e.g. `"patient-intake"`, `"contact-form"`).
- **Session**: a single editing lifetime of a form. Starts when the user opens the form, ends when it is submitted (or discarded).
- **Snapshot**: a JSON object representing form values at a point in time.
- **Storage**: by default, snapshots live in IndexedDB via Dexie.

The main building blocks are:

- `useFormSnapshots` – autosave + restore for DOM forms.
- `useRHFFormSnapshots` – autosave + restore for React Hook Form.
- `useObjectFormSnapshots` – autosave + restore for arbitrary state objects.
- `FormSnapshotsProvider` – global config (retention, excluded fields, discard policy).
- `FormSnapshotsDevtools` – in‑browser dev panel to view sessions & data.
- `useFormSnapshotsList` – hook to list a form’s past sessions (history UI).
- `FormSnapshotTable` – small component to render snapshot key/value data.

You can see how these pieces fit together in the other docs:

- [2. Basic Usage with DOM Forms](./basic-usage.md)
- [3. Configuration & Session Behaviour](./configuration.md)
- [4. Devtools & Snapshot Inspection](./devtools.md)
- [5. Integrations (React Hook Form, Zod, object state)](./integrations.md)

---

### Installation

```bash
npm install form-snapshots

# peer dependencies
npm install react react-dom dexie dexie-react-hooks react-hook-form
```

Requirements:

- **React 18+**
- Any bundler that understands ES modules / CJS (Vite, Next, CRA, etc.)

Once installed, import from the package root:

```ts
import {
  useFormSnapshots,
  FormSnapshotsProvider,
  FormSnapshotsDevtools,
} from "form-snapshots"
```

Next: see [2. Basic Usage with DOM Forms](./basic-usage.md) for a minimal integration example.


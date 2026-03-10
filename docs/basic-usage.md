## 2. Basic Usage with DOM Forms

This page shows how to use `useFormSnapshots` with a regular HTML form (uncontrolled inputs).

If you are using **React Hook Form** or a custom state object instead of plain DOM inputs, see  
[5. Integrations (React Hook Form, Zod, object state)](./integrations.md).

---

### The minimal example

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

  const onSubmit = wrapSubmit((event) => {
    // Your existing submit logic here:
    // fetch("/api/contact", { method: "POST", body: new FormData(event.currentTarget) })
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

**What this does:**

- On **blur** (when an input loses focus), `handleBlur` captures the current form values and saves them to IndexedDB.
- When the component **mounts**, the latest snapshot (if any) is applied back into the form.
- On **submit**, `wrapSubmit`:
  - captures the final state,
  - runs your original submit handler,
  - and closes the session only when submit succeeds.

---

### Why use `formName`?

The first argument of `useFormSnapshots` is `formName`:

```ts
useFormSnapshots("contact-form")
```

You should:

- Use **one distinct `formName` per logical form**.
- Reuse the same `formName` if the user revisits that form later and you want them to see the same draft/history.

The devtools and history hooks use this name to group and filter sessions.

---

### Common options (DOM forms)

`useFormSnapshots` accepts an options object:

```ts
useFormSnapshots("contact-form", {
  snapshotsLimit: 24 * 60 * 60 * 1000, // how long to retain history (ms)
  excludeFields: ["password", "patient.ssn"], // field paths to skip
  discardOnSubmit: false, // if true: delete session + clear form after submit
})
```

- **`snapshotsLimit`** (number, ms):
  - Controls how long sessions are kept.
  - Older sessions are pruned automatically.
- **`excludeFields`** (string[]):
  - Lets you skip sensitive or noisy fields from snapshots.
  - For DOM forms this typically means simple field names (e.g. `"password"`).
- **`discardOnSubmit`** (boolean):
  - When `true`, the active session is **deleted** right after submit and the form is **cleared**.
  - Use this when you don’t want to keep any submitted data in local history (e.g. for highly sensitive flows).

All of these options can also be configured globally; see  
[3. Configuration & Session Behaviour](./configuration.md).

---

### When to prefer DOM mode vs adapters

Use DOM based `useFormSnapshots` when:

- Your form relies heavily on native form behaviour.
- You are fine with **flat** name → value snapshots (no deeply nested structures).

Use one of the adapters when:

- You already manage state in **React Hook Form** or a custom state object.
- You need to **snapshot nested objects** (e.g. patient models, address objects).

For those scenarios, continue with  
[5. Integrations (React Hook Form, Zod, object state)](./integrations.md).

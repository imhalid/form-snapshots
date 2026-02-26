## 5. Integrations (React Hook Form, Zod, object state)

This page shows how to integrate `form-snapshots` with:

- **React Hook Form** (`useRHFFormSnapshots`)
- **Object/React state** (`useObjectFormSnapshots`)
- Validation libraries such as **Zod**

If you are looking for plain DOM forms, see  
[2. Basic Usage with DOM Forms](./basic-usage.md).

---

### 5.1 React Hook Form (`useRHFFormSnapshots`)

The `useRHFFormSnapshots` adapter plugs directly into a `UseFormReturn` from React Hook Form.

**Why use it instead of plain `useFormSnapshots`?**

- It snapshots the **entire form state object**, including nested fields.
- It restores using `form.reset(snapshot)`, so RHF stays the single source of truth.

**API:**

```ts
useRHFFormSnapshots(formName: string, form: UseFormReturn, options?: RHFSnapshotsOptions)
```

**Example with Zod + React Hook Form:**

```tsx
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRHFFormSnapshots } from "form-snapshots"

const schema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message is too short"),
})

type ContactFormValues = z.infer<typeof schema>

export function ContactFormRHF() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      message: "",
    },
  })

  const {
    formRef,
    handleBlur,
    wrapSubmit,
    restoreLatest,
    isSubmitted,
  } = useRHFFormSnapshots("contact-form-rhf", form, {
    snapshotsLimit: 7 * 24 * 60 * 60 * 1000,
    excludeFields: ["message"], // example: don't keep the message text
  })

  const onSubmit = wrapSubmit(async () => {
    const values = form.getValues()
    // Use values with your API
    // await api.sendContact(values)
  })

  return (
    <form ref={formRef} onBlur={handleBlur} onSubmit={onSubmit}>
      <input {...form.register("fullName")} placeholder="Full name" />
      <input {...form.register("email")} type="email" placeholder="Email" />
      <textarea {...form.register("message")} placeholder="Message" />

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

Under the hood, the adapter simply wires:

- `getValues: () => form.getValues()`
- `applyValues: (snapshot) => form.reset(snapshot)`

so snapshots always reflect your RHF state.

---

### 5.2 Object / React state (`useObjectFormSnapshots`)

If your form is backed by a simple state object (e.g. `useState`, Zustand), use `useObjectFormSnapshots`.

**API:**

```ts
useObjectFormSnapshots<TState extends Record<string, unknown>>(
  formName: string,
  state: TState,
  setState: (next: TState) => void,
  options?: ObjectStateSnapshotsOptions,
)
```

**Example with `useState` + Zod validation:**

```tsx
import { useState } from "react"
import { z } from "zod"
import { useObjectFormSnapshots } from "form-snapshots"

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z.number().int().nonnegative(),
})

type ProfileState = z.infer<typeof schema>

export function ProfileForm() {
  const [state, setState] = useState<ProfileState>({
    firstName: "",
    lastName: "",
    age: 0,
  })

  const {
    formRef,
    handleBlur,
    wrapSubmit,
    restoreLatest,
  } = useObjectFormSnapshots("profile-form", state, setState, {
    excludeFields: ["age"], // example: don't keep age
  })

  const onSubmit = wrapSubmit(async () => {
    const parsed = schema.safeParse(state)
    if (!parsed.success) {
      // handle errors as you like
      return
    }

    // use parsed.data with your API
    // await api.saveProfile(parsed.data)
  })

  return (
    <form ref={formRef} onBlur={handleBlur} onSubmit={onSubmit}>
      <input
        name="firstName"
        value={state.firstName}
        onChange={(e) => setState({ ...state, firstName: e.target.value })}
      />
      <input
        name="lastName"
        value={state.lastName}
        onChange={(e) => setState({ ...state, lastName: e.target.value })}
      />
      <input
        name="age"
        type="number"
        value={state.age}
        onChange={(e) =>
          setState({ ...state, age: Number(e.target.value) || 0 })
        }
      />

      <button type="submit">Save</button>

      <button type="button" onClick={restoreLatest}>
        Restore last draft
      </button>
    </form>
  )
}
```

Here:

- `getValues` always returns the current `state`.
- `applyValues` calls `setState(snapshot)`.

So snapshots represent your **full object model**, not just flat DOM fields.

---

### 5.3 Validation libraries (Zod, Yup, custom)

`form-snapshots` is **validation‑agnostic**:

- It never calls your schema directly.
- It just gives you back whatever you saved as a snapshot.

Typical patterns:

- With RHF + Zod:
  - Use `zodResolver` inside `useForm`.
  - Let RHF validation run as usual in your submit handler.
  - Snapshots simply hold the **values** (not the validation state).
- With custom validation:
  - Run your validation logic inside the function you pass to `wrapSubmit` / `wrapSubmitAsync`.

Example (async + status tracking):

```tsx
const { wrapSubmitAsync, markSubmitResult } = useRHFFormSnapshots(
  "survey-form",
  form,
)

const onSubmit = wrapSubmitAsync(async () => {
  const result = await schema.safeParseAsync(form.getValues())
  if (!result.success) {
    return { statusCode: 400, errorMessage: "Validation failed" }
  }

  // Call your backend
  const res = await fetch("/api/survey", {
    method: "POST",
    body: JSON.stringify(result.data),
  })

  return {
    statusCode: res.status,
    errorMessage: res.ok ? null : "Submit failed",
  }
})
```

The devtools will then show:

- `status 200` with no error, or
- `status 400` + `"Validation failed"`, etc.

which makes it easier to debug real‑world flows.

---

### Where to go next

- For DOM forms: [2. Basic Usage with DOM Forms](./basic-usage.md)
- For global policies and history: [3. Configuration & Session Behaviour](./configuration.md)
- For visual inspection during development: [4. Devtools & Snapshot Inspection](./devtools.md)


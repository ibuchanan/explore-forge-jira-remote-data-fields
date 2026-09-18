# Form decision service API

The remote (`apps/remote`) exposes a stateless, read-only decision
service for one ordered form. The client holds draft `state`; the API
determines field order, selectable values, and validity. The API never
persists `state`. The full contract, including JSON Schemas, is in
[`apps/remote/openapi.yaml`](../../apps/remote/openapi.yaml).

## Endpoints

| Method | Path                         | Purpose                                                            |
|--------|------------------------------|--------------------------------------------------------------------|
| `POST` | `/form/step`                 | Return the next field for a given `state`, or completion.          |
| `POST` | `/fields/{fieldKey}/options` | Return up to 25 selectable values for `fieldKey` matching `query`. |
| `POST` | `/form/validate`             | Confirm a complete `state` is currently valid.                     |

### `POST /form/step`

- **Request body**: `{ state: FormState }`
- **200**: a `FormStep` — either `{ state, complete: false, field }` with
  the next `Field` descriptor, or `{ state, complete: true }`.
- **422**: `FormStateProblem` when `state` is not a valid, contiguous
  answer prefix under current rules.

### `POST /fields/{fieldKey}/options`

- **Path parameter**: `fieldKey` — must be the field returned by the
  most recent `/form/step` call for the supplied `state`.
- **Request body**: `{ state: FormState, query: string }`
- **200**: `{ options: string[], truncated: boolean }`. `options` has at
  most 25 entries; `truncated: true` means more matches exist and the
  client should ask for a narrower query.
- **404**: the requested `fieldKey` does not exist.
- **422**: `FormStateProblem` — `fieldKey` is not the next field
  reachable from `state`, or `query` is shorter than the field's
  `minimumQueryLength`.

### `POST /form/validate`

- **Request body**: `{ state: FormState }`
- **204**: `state` is a complete and currently valid form.
- **422**: `FormStateProblem` describing what's invalid.

## Types

### `FormState`

An object mapping field `key` to a `string` value or explicit `null`.
A key absent from the object means the field is unanswered. `null` is
accepted only for a field where `allowsNull` is `true`.

### `Field`

Descriptor for the field a client must answer next.

| Property             | Type      | Notes                                                               |
|----------------------|-----------|---------------------------------------------------------------------|
| `key`                | `string`  | Identifier used in `state` and in the options path.                 |
| `label`              | `string`  | User-visible label.                                                 |
| `description`        | `string?` | Optional help text.                                                 |
| `placeholder`        | `string?` | Optional type-ahead prompt.                                         |
| `minimumQueryLength` | `integer` | Minimum characters before the client should search.                 |
| `allowsNull`         | `boolean` | Whether an explicit no-value answer can satisfy this field.         |
| `nullLabel`          | `string?` | Present only when `allowsNull` is `true`; label for the null value. |

### `FormStateProblem`

An [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem-details
object extended with:

| Property               | Type               | Notes                                             |
|------------------------|--------------------|---------------------------------------------------|
| `firstInvalidFieldKey` | `string?`          | Earliest field needing correction, if applicable. |
| `errors`               | `FormStateError[]` | At least one entry.                               |

Each `FormStateError` has `type` (a stable, machine-readable URI),
`detail` (user-visible text), and an optional `fieldKey`.

## Persistence

This API does not save anything. The Forge app persists the confirmed
`state` separately, as the issue entity property
`text-properties-form-state`, via the `write:jira-work` scope declared
in [`apps/forge/manifest.yml`](../../apps/forge/manifest.yml).

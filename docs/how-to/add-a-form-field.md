# How to add a field to the sample form

To add a new field to the form, edit
[`apps/remote/src/sample-form.ts`](../../apps/remote/src/sample-form.ts).
The remote is the only source of field order, selectable values, and
validation — no other file needs to change to add a field.

## Add the field descriptor

Insert a new entry into the `fields` array, in the position where the
field should appear:

```ts
{
  key: "releaseTrain",
  label: "Release train",
  description: "Optional planning classification.",
  placeholder: "Search release trains",
  minimumQueryLength: 1,
  allowsNull: true,
  nullLabel: "Not planned for a release",
},
```

- `key` must be unique and is what clients send back in `state`.
- `minimumQueryLength` controls how many characters the client's
  type-ahead waits for before calling `searchFieldOptions`. Use `0` if
  any query, including an empty one, should search immediately.
- Set `allowsNull: true` and provide `nullLabel` if an explicit "no
  value" answer should be able to satisfy this field. Otherwise set
  `allowsNull: false` and omit `nullLabel`.

Field order in the array is the order the form is presented in.
`evaluateFormState` rejects answers submitted out of order, so if you
reorder existing fields, existing in-flight `state` objects that skipped
ahead will fail validation until the client restarts that field.

## Add its selectable values

Add a matching entry to `optionsByField`, keyed by the same `key`:

```ts
releaseTrain: ["2026.10", "2026.11", "2026.12", "2027.01"],
```

Each string in the array is both the stored value and its display
label. `searchOptions` filters this list case-insensitively against the
client's query and returns at most 25 matches; if you expect a field
to routinely exceed 25 matching values, tell users to narrow their
query rather than relying on pagination — none exists.

## Validate the change

Run the remote's checks before deploying:

```bash
npm run --workspace=jira-remote-data-fields-backend check
```

Then redeploy with `npm run forge:deploy:tunnel` (or restart
`npm run remote:start` if you're iterating without Forge) and confirm
the new field appears in the panel in the position and order you
expect.

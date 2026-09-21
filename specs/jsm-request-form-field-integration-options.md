# JSM request form and field integration options

## Status

Exploration note. This records the problem and viable directions; it does not
select a final architecture.

## Problem

The remote data-fields form currently makes a sequence of domain decisions (for
example, owning team, priority, and release train). We want to understand how
that form can interact with Jira Service Management (JSM) request fields in both
directions:

- **Native fields as inputs:** a customer’s Summary, Description, or configured
  request fields may determine which remote questions, defaults, or options are
  shown.
- **Domain answers as outputs:** completed remote answers may determine values
  in native Jira/JSM fields.

The important distinction is the lifecycle of a portal request. While a customer
is completing a JSM portal request, there is no Jira issue yet. Native
request-field values and app state exist only in the browser. Jira REST APIs
cannot read or update a request that has not been created.

## State across the request lifecycle

| Phase | Available state | What is not available |
| --- | --- | --- |
| Request form opens | Portal ID and request type ID | Jira issue ID/key; submitted native values |
| Customer edits native request fields | Browser-only native-field draft | Jira REST resource for the request |
| Customer edits app fields | Browser-only app draft | Automatic sharing with the native-field draft |
| Customer creates request | Submitted native values and app-property data are persisted | Synchronous post-create REST mutation before creation completes |
| Request exists | Jira issue fields, app properties, request key | The original unsaved drafts |

This produces two distinct pre-create state channels:

1. **Host draft** — JSM’s native request form, including Summary and supported
   request fields.
2. **App draft** — values owned by the remote data-fields UI.

They should not be described as one shared state object unless a supported Forge
mechanism explicitly synchronizes them.

## Forge surfaces and boundaries

### UI Modifications

A `jira:uiModifications` module can run on the JSM portal request-create form
(Preview). Its extension context identifies the form:

- portal ID;
- request type ID; and
- `JSMRequestCreate` view type.

It does **not** carry the current Summary, Description, Reporter, or other draft
answers. The app reads supported native draft fields through the UI
Modifications `FieldAPI`, such as `getFieldById("summary").getValue()`.

UI Modifications can change supported existing host fields through operations
such as:

- `setValue()`;
- `setVisible()`;
- `setReadOnly()`;
- `setRequired()`;
- `setName()` and `setDescription()`; and
- `setOptionsVisibility()` for supported select fields.

These modifications affect the request form and therefore its eventual creation
payload. They are not REST updates to an issue.

Relevant constraints include:

- Summary and Description changes are observed on blur; other supported fields
  use their normal change events.
- Field changes are batched after an `onInit` or `onChange` callback; getters do
  not read setter changes made in that same callback.
- A change callback must declare every field it intends to modify.
- The request-create portal support is Preview, loads after the portal form, and
  can briefly show unmodified fields.
- UI Modifications do not support Forge custom fields.
- UI Modifications are a host-form controller, not a visible custom multi-step
  form surface.

### Portal request-create property panel

A `jiraServiceManagement:portalRequestCreatePropertyPanel` renders a visible
Forge Custom UI panel while the customer creates the request. It is appropriate
for the remote data-fields form itself.

The panel can call `view.submit({ fields, isValid })` as its app state changes.
On request creation, JSM persists those fields as app-owned issue-property data.
`isValid: false` prevents the portal request from being created until the
panel’s required state is complete.

The panel does not receive live native request-field values. Its context
supplies portal and request type identity, not a native host-field draft.

The app now uses this surface for the remote data-fields form. It submits the
completed remote state as a request property and retains the issue-context and
request-detail panels for requests that already exist.

### Post-create surfaces

Once the request exists, the app can use the Jira REST API and issue properties.
At that point it can:

- read native Jira fields and the persisted app state;
- re-run decision logic against canonical values;
- update editable native fields; and
- record provenance for applied mappings.

This happens after creation, not as an atomic part of the customer’s portal
submission.

## Options to explore

### 1. App-owned request-create form

Use the portal request-create property panel as the authoritative remote form.

```text
app questions → remote decision service → view.submit(app property) → request created
```

**Fits when:** domain questions are primary and native Summary/Description do
not need to drive the form before creation.

**Benefits:** supports a rich multi-step UI; app state persists with request
creation; app validation can block submission.

**Limits:** cannot dynamically use the customer’s live native-field draft;
cannot set native request fields during creation.

### 2. Native-field policy with UI Modifications

Use UI Modifications to read and control existing native request fields.

```text
native request draft → FieldAPI → remote policy → FieldAPI setters → request created
```

**Fits when:** the entire decision flow can be represented by existing JSM
fields.

**Benefits:** native field values can influence other native fields before the
request is created; outputs are in the initial request payload.

**Limits:** no app-owned multi-step panel; constrained to supported native
fields and Preview behavior.

### 3. Separate app panel and native-field policy

Run the property panel for app-owned questions and a UI Modification for
separate native-field rules.

**Fits when:** both app-owned data and native-field guidance are useful, but
neither needs to observe the other’s live draft.

**Benefits:** each surface uses its supported lifecycle and ownership model.

**Limits:** the two drafts are not automatically synchronized. Treating them as
one form would create unsupported coupling and unclear validation behavior.

### 4. App-owned creation, then post-create reconciliation

Persist app answers at creation through the property panel. After the request
exists, read both native Jira fields and the app property, then apply a final
decision or Jira field mapping.

```text
app draft → request property → request created
                         ↓
             read canonical issue + property → final decision → Jira update
```

**Fits when:** final native Jira values depend on both app answers and submitted
host fields.

**Benefits:** final decisions use canonical persisted data, not browser drafts.

**Limits:** mapping is asynchronous; there may be a period in which the new
request lacks its derived native values. Downstream automation must tolerate
that delay.

### 5. Make all required pre-create inputs app-owned

Ask for inputs that would otherwise be taken from native fields inside the app
panel itself, then optionally mirror the outcomes after creation.

**Fits when:** a single guided decision flow is more important than using the
standard native request fields as inputs.

**Benefits:** one actual draft and one validation model before creation.

**Limits:** duplicates information already present in JSM; customers may see
overlapping questions; synchronization policy is still needed after creation.

### 6. Use a Forge custom field for a durable domain value

Model one final domain value as a Jira custom field, potentially rendered in the
JSM portal, rather than retaining every answer only in an app property.

**Fits when:** one result needs to behave like a first-class Jira field for
search, reporting, or automation.

**Benefits:** makes the selected result visible to Jira-native tooling.

**Limits:** it does not create a general-purpose bridge to UI Modifications; UI
Modifications do not support Forge custom fields. A custom field is likely
complementary to, not a replacement for, the remote multi-step form.

## Questions to answer before choosing

1. Which native request fields must influence the remote form before a request
   exists?
2. Which remote answers must be present in the initial Jira request payload,
   rather than shortly after creation?
3. Is an asynchronous post-create reconciliation acceptable to request-routing,
   SLA, and automation consumers?
4. Can the desired customer flow be represented with existing JSM request
   fields, or does it require an app-owned multi-step UI?
5. Are app answers and native fields allowed to disagree after creation? If so,
   which is authoritative?
6. Which data must be native Jira fields for reporting/search/automation, and
   which can remain app-owned issue-property data?
7. Is Preview support for JSM portal UI Modifications acceptable for the
   intended use and customer audience?
8. Must anonymous customers use the form? The property panel and UI
   Modifications have different access constraints.
9. What provenance should be retained to explain a derived Jira value: source
   answers, rules version, time, and applied mapping?

## References

- [JSM UI Modifications
  module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-service-management-ui-modifications/)
- [UI Modifications
  API](https://developer.atlassian.com/platform/forge/apis-reference/jira-api-bridge/uiModifications/)
- [JSM portal request-create property
  panel](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-service-management-portal-request-create-property-panel/)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

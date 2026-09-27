# One form across Jira and JSM surfaces

This sample shows the same remote data-field form in four places: a
panel on a Jira work item, the Jira create issue dialog, the Jira Service
Management (JSM) portal's request-create screen, and a portal request's
detail view. It's tempting to think of that as one field rendered four
times. That picture is misleading. The questions and rules are the same
everywhere, but each host decides when the user answers, what the app
knows at that moment, how the answers are handed over, and where they
can be found afterwards. Those are contracts, not cosmetic differences,
and the Forge app has to adapt to each one.

This page assumes you already know how the work is divided between the
Forge app and the remote, as described in
[The Forge app and the remote](app-and-remote.md).

## What stays the same

On every surface the remote answers the same three questions: what the
next field is, which values can be selected for it, and whether a set of
answers is valid. The answers take the same shape everywhere: the
`FormState` object of field keys mapped to a selected value, an explicit
`null`, or no key at all. The rules that judge that object live in one
place, and the
[form decision service API](../reference/form-decision-service-api.md)
doesn't know or care which host is asking.

The rendering is shared too. All four surfaces load the same Custom UI
resource, so the user sees the same step-by-step, type-ahead
interaction. That reuse is real and worth having, but it covers only the
parts of the form that don't depend on the host. It hides the
host-specific differences without removing them.

## Before the entity exists, and after

The most important difference is whether the Jira work item or JSM
request already exists when the user answers.

After creation there is something to attach answers to. The work item
has an ID, the app can read and write an issue entity property on it,
and that write goes through Jira's permissions for the current user. The
app controls when the write happens. It can check the completed answers
with the remote first and save them only if the remote accepts them.

Before creation none of that is true. There's no issue ID and no
property to write, and a Jira REST call has nothing to target. The user
is filling in a form that the host owns, and the host decides when the
entity comes into existence: when the user clicks Create. The app can't
write the answers anywhere itself. It can only give the host a value and
let the host store it as part of creation. So a create-time surface
doesn't save anything. It *submits to the host*, in the format the host
expects, and trusts the host to persist the value when the entity is
created.

That also changes when validation happens. On an existing work item the
app can validate at the moment it saves. On a create surface, the app
gives the host its latest verdict, meaning whether the remote last
reported the form as complete, and the host commits that value later,
when the user clicks Create. Keeping the host up to date on each step is
how the app stays in step with a lifecycle it doesn't control.

## The Forge app as an adapter

[`apps/forge/src/host.ts`](../../apps/forge/src/host.ts) is where these
contracts show up in the code. It looks at the extension context Forge
provides and answers two questions: what state the form should start
from, and what, if anything, to hand to the host as the answers change.
[`apps/forge/src/index.tsx`](../../apps/forge/src/index.tsx) asks those
questions and otherwise runs the same interaction everywhere.

The answers differ in substance, not just in format:

- The **portal request-create panel** wants a list of properties plus a
  validity flag. An invalid flag stops the customer from creating the
  request.
- The **create dialog's custom field** wants the field's value. The app
  submits the form state when the form is complete and `null` otherwise,
  so an unfinished form never leaves a value behind.
- **Panels on existing entities** take no submission from the host.
  The UI shows a Save button and writes the issue property with Jira's
  user-context API.

These are three different ways of handing over the answers, and each
comes with its own rules about timing, validity, and where the data ends
up.

## The surfaces in this sample

[`apps/forge/manifest.yml`](../../apps/forge/manifest.yml) is the
authority on which surfaces are active. It wires the four UI surfaces
below, plus an `avi:jira:created:issue` trigger that supports the create
dialog.

| Surface | Entity exists? | Form starts from | Answers leave the UI by | Answers end up in |
| --- | --- | --- | --- | --- |
| Jira issue context panel | Yes | The saved issue property | Save, after remote validation, through the UI's user-context Jira API call | The `remote-data-fields-form-state` issue property |
| Jira create dialog custom field | No | The field's current value, if any | Submitting the field value on each step | The field value, then copied to the issue property after creation |
| JSM portal request-create panel | No | An empty form | Submitting request properties and validity on each step | An issue property that JSM writes at creation |
| JSM portal request detail panel | Yes | Request property supplied by Forge context | No write; read-only | Captured request property (creation snapshot) |

The table is only a summary. The exact payload handling is in
[`host.ts`](../../apps/forge/src/host.ts) and `index.tsx`; creation-time
copying is implemented by [`triggers.ts`](../../apps/forge/src/triggers.ts).

### Jira issue context

This is the simplest case, and it's the one the
[app and remote explanation](app-and-remote.md) uses as its main
example. The work item exists, so the panel loads the saved property,
re-evaluates it against the current rules, and lets the user change and
save it. Persistence is fully under the app's control.

### The Jira create dialog

Jira's create issue dialog has no panel module. The only way to put app
UI there is a Forge custom field that can be edited on create. So the
sample declares one object-type field that holds the *whole* form, with
the entire form state as its value. That's why
[`CONTEXT.md`](../../CONTEXT.md) calls it the *form state field* and
says it isn't a remote data field itself.

The field value is an intermediate representation. It's the only thing
that can carry the answers across the creation boundary, but it isn't
where the post-create panels look. After the work item is created, a
trigger copies the value to the issue property, so that from then on
there's one store to read and write. The copy runs as the app, not as
the user, because it reacts to an event rather than to a user action.
It skips events the app caused itself, empty values, and values that
don't have the form-state shape.

The result is two representations with different meanings. The field
value is the snapshot at creation time. The issue property is
authoritative after that. If someone later changes the answers in the
issue panel, the property changes and the field value doesn't.

Because the form is a single custom field, requiring an answer is a Jira
admin decision: the admin marks the field required on the create
screen. The field doesn't declare its own create-time validation. That
would also apply to creation paths that never show this field, such as
portal requests and REST calls.

### The JSM portal request-create screen

The portal gives apps a dedicated panel for this moment. The panel
submits the form state with a validity flag as the customer answers, and
JSM stores it as an issue property when the request is created. The
validity flag lets the remote's decisions block creation of an
incomplete request without the app owning the create action.

The panel has limits. It doesn't see the customer's in-progress native
fields, such as Summary or Description, so those can't shape the remote
form before the request exists. How to connect native request fields
with the remote form is still an open question.

JSM also decides the storage key, not the app. According to the
[Forge module reference](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-service-management-portal-request-create-property-panel/),
properties submitted this way are stored under a property named after
the app's ID, as an object containing the submitted fields. The
issue-created trigger reads that request property and copies the form
state to `remote-data-fields-form-state`, so the Jira issue-context panel
can load and update it. The portal detail panel instead reads the request
property supplied by its host context, which remains the creation-time
snapshot.

### The JSM portal request detail view

The request detail panel uses the shared UI resource but is read-only.
Forge supplies the request property in the extension context; the UI
extracts `remote-data-fields-form-state` from that property and displays
the answers captured at request creation. It does not load or write the
Jira issue property from this surface. This avoids requiring portal
customers to use Jira's issue-property APIs and keeps this panel from
changing saved answers.

The issue-created trigger separately reads the JSM request-create
property when there is no create-field value, then copies the form state
to the issue's `remote-data-fields-form-state` property. The two values
therefore have different roles: the request property is the detail view's
create-time snapshot, while the issue property is the value the Jira
issue-context panel loads and updates. The portal panel remains read-only
even if the issue property later changes.

## The limits of reuse

The part of this design that travels across surfaces is the decision
model: one set of rules, one answer shape, one remote. Much of the
interaction carries over too. What doesn't carry over has to be handled
deliberately for each host:

- how the initial state is read;
- what the app submits, and when;
- when the answers become durable;
- who can see and use the surface, such as licensed users or portal
  customers;
- how create-time values are reconciled with state stored after
  creation.

It helps to separate three states that are easy to blur together: the
*draft* the user is editing in the browser, the value *submitted at
create* that the host will persist, and the state *persisted on an
existing entity* that later surfaces read. A draft isn't durable until a
host or the app stores it, and nothing moves a draft from one surface to
another. Answers the user is working on in the create dialog don't
appear in a portal panel, and a value submitted at creation reaches the
issue property only through the reconciliation path that its surface
provides.

When reading the code, it's also worth separating what's wired from
what's only written. A helper in `form-state.ts` or a branch in
`host.ts` shows intent. The manifest shows what Jira actually loads. For
the host lifecycle, the manifest is the source of truth, and the Forge
module reference is the source of truth for what each host provides and
expects.

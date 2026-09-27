# The Forge app and the remote

If you have worked with Jira fields before,
you probably expect a field
to come with a definition that Jira understands:
a type,
a set of allowed values or a way to find them,
and validation that Jira itself enforces.
This sample breaks that expectation on purpose.
It is not a Jira field whose choices happen to come from an API.
It is a form defined by a remote service
and shown inside a Forge surface.
The rules live in the remote,
the user's draft lives in the Forge UI,
and the confirmed result lives in Jira.

This page explains how those responsibilities are split,
why they are split that way,
and what the split costs.
For hands-on setup,
see the [tutorial](../tutorials/build-your-first-remote-data-field.md).
For the exact contract,
see the [form decision service API reference](../reference/form-decision-service-api.md).
To change the form,
see [how to add a form field](../how-to/add-a-form-field.md).

## How this differs from a native Jira field

A native custom field belongs to Jira's field system.
An admin creates it,
Jira knows its type,
and Jira's own rules decide what a valid value is.
That model works well when the rules are static
and Jira can check them:
a number, a date, or a select list whose options an admin maintains.
Jira's [field types](https://support.atlassian.com/jira-cloud-administration/docs/field-types-you-can-create-as-a-jira-admin/)
all fit that model.

The form in this sample doesn't.
Which question comes next,
which answers can be selected,
and whether a set of answers is acceptable
are all decisions made by an external domain service.
Those decisions can depend on earlier answers
and on data that changes over time.
Jira can't work them out from a static field definition,
because the remote never gives Jira one.
The UI finds out what to render by asking the remote,
one step at a time.

This is why the glossary term _remote data field_ needs care.
In [`CONTEXT.md`](../../CONTEXT.md),
a remote data field is one question
whose values, validation, and next-step behavior come from the remote.
It is a unit of the remote's form,
not a separate Jira custom field.
When the sample does register a Jira custom field for the create dialog,
that single field holds the _whole_ form.
Its value is the entire form state, not one answer.

None of this means native fields are inadequate.
It means that once the rules belong to another system,
Jira's field model no longer describes them.

## Four participants, four kinds of authority

It helps to follow one user answering one question
and see who does what.

The **Forge UI**
([`apps/forge/src/index.tsx`](../../apps/forge/src/index.tsx))
is the interactive client.
It asks the remote for the next step,
renders the field descriptor it gets back,
sends search queries as the user types,
and holds the user's draft answers in memory.
It doesn't know how many fields exist,
what order they come in,
or which values are valid.
It renders whatever the remote's latest response describes.

The **remote** ([`apps/remote`](../../apps/remote))
is the authority on the form's decisions.
Given a set of answers,
it works out the next field or reports that the form is complete.
It searches selectable options for the current field
and judges whether a proposed set of answers is valid.
It isn't a UI,
and it keeps no record of the user between calls.

The **Forge app** also adapts the form to its host.
On an existing Jira issue,
the UI reads and writes the `remote-data-fields-form-state` issue property
directly with `requestJira`, as the current user.
At create time,
Jira owns the creation flow:
the custom field or JSM panel submits the form state to the host,
and the `avi:jira:created:issue` trigger copies
that captured value to the issue property as the app.
The trigger's copying rules live in
[`apps/forge/src/form-state.ts`](../../apps/forge/src/form-state.ts),
and its Jira I/O is in
[`apps/forge/src/triggers.ts`](../../apps/forge/src/triggers.ts).

**Jira** holds the post-creation form state
in the `remote-data-fields-form-state` issue property.
The JSM portal detail surface separately receives
the request property from its host context
and displays that captured state read-only.

Two claims here sound alike but are different:
"Jira owns the stored answer"
and "Jira owns the rules that produced it."
The first is true in this sample.
The second isn't.
The remote is the source of truth for _what a valid answer is_.
Jira is the source of truth for _what the answer on this work item is_.
The Forge UI is the source of truth for neither.
It holds a draft that becomes meaningful
only after the remote accepts it and Jira stores it.

## Form state: absent, null, and answered

All three participants share one data shape,
`FormState`: an object that maps field keys to answers.
The shape is small,
but it carries more meaning than it first appears to.

- A **missing key** means the question hasn't been answered yet.
  The first field whose key is missing is where the form currently stands.
- **`null`** is an answer.
  It means the user explicitly chose "no value."
  The remote accepts it only for fields that allow it,
  such as the optional release train with its "Not planned for a release" label.
- A **string** is a selected option.
  It counts only if it is one of the field's currently selectable values.

Keeping "not answered" separate from "answered with nothing" matters.
It lets the remote tell a form that is still in progress apart
from one where the user deliberately skipped an optional question.
Order matters too.
The state has to be a contiguous prefix of the form,
so an answer to a later field with an earlier one missing
is rejected as out of order.
The object is technically a map,
but it behaves like an ordered sequence of answers.

## The form as a state machine

In [`apps/remote/src/sample-form.ts`](../../apps/remote/src/sample-form.ts),
`evaluateFormState` works as a transition function in the everyday sense:
given the current state,
it returns either the next field or completion.
It walks the fields in order,
checks each answer it finds,
and stops at the first gap or the first problem.
Going back to change an earlier answer isn't a special operation.
The UI removes the last answer
and asks the same question again with the shorter state.

The three operations in
[`apps/remote/openapi.yaml`](../../apps/remote/openapi.yaml)
are three views of that one function:

- **Evaluating a step**
  returns the next field or completion for the supplied state.
- **Searching options**
  first re-evaluates the state,
  then refuses to search any field
  that isn't the next one reachable from that state.
  So options are only valid in context.
  A value is selectable for _this_ field,
  given _these_ earlier answers.
- **Validating**
  re-evaluates the whole proposed state against the rules
  and data as they are now,
  and accepts it only if the state is complete.

None of this needs a workflow engine or a server-side session.
The "machine" is ordinary code
that re-derives its position from the input every time.

## What "stateless" means here

"Stateless" doesn't mean the app stores no data.
Jira stores the confirmed answers,
and the Forge UI holds a draft while the user works.
It means something narrower:
**the remote keeps no memory of a form in progress.**
Each request carries the answer state the remote needs,
and the remote computes its response
from that state and its current rules.
Nothing is left behind for the next call.
[`apps/remote/src/server.ts`](../../apps/remote/src/server.ts)
shows how little the server itself holds.
Its handlers do nothing except pass the request body to the decision functions.

This has concrete benefits.
Any instance of the remote can answer any request,
so no request has to return to the same server.
Restarting or scaling the remote loses nothing,
because there's no session to lose.
And there's one ruleset:
the client never builds its own copy of the form's structure
that could drift from the server's.

That last point is also
why the UI doesn't fetch the field list once and cache it.
Field order,
which fields accept `null`,
and which values are currently valid
are all decisions the remote is allowed to change.
A value that was selectable a minute ago may not be selectable
when the user saves.
A cached field list would let the client act on rules it doesn't own.
Asking "what's next?" at every step is
the price of keeping those rules in one place.

Statelessness has costs too.
Every call re-sends the answers so far,
and the remote checks them again each time instead of trusting a session.
For a three-field form that cost is negligible.
For a form with dozens of interdependent fields,
or expensive lookups behind each check,
it would be worth measuring.
Rules can also change _between_ calls.
The final validation before saving exists partly to catch that:
a completed draft is checked against the current rules,
not the rules in force when each answer was chosen.

## Deciding without persisting

If the remote is the authority on valid answers,
why doesn't it save them?
The confirmed answer has to end up on a Jira work item,
protected by Jira's permission model.
The Forge UI already has that path:
it runs in the user's Jira context with the `write:jira-work` scope
and writes the issue property as the user.
Giving the remote its own route into Jira
would mean duplicating Jira's authorization and audit trail
in a second system,
just so the remote could do something the app already does properly.
So the API is read-only by design.
It recommends and validates,
and the Forge UI performs the issue-property write.

The client isn't trusted just because it holds the draft.
In the issue context panel,
the UI sends the completed state to the remote for validation
and saves it only if the remote accepts it.
When that panel opens,
previously saved state is sent back through step evaluation,
so an answer that has become invalid under today's rules
is surfaced instead of silently accepted.
In this sample,
the "validate, then write" order is enforced by the UI:
both the remote call and the user-context Jira property write
happen in the frontend.
A production system
that needs a stronger guarantee could move validation and persistence
behind one backend operation so the two cannot be separated.

Create-time surfaces follow their host contracts instead:
Jira and JSM receive the state during creation,
then the issue-created trigger copies the captured value to the issue property.
The portal detail panel
shows the request property provided in its context read-only;
it does not edit that value.

Surfaces that save on create,
such as the create dialog's custom field
or a service management portal request,
hand the state to the host instead of writing it directly.
How that changes where the state lives over time
is a question about each host's lifecycle,
covered in [One form across Jira and JSM surfaces](one-form-across-host-surfaces.md).
The decision boundary is the same everywhere:
the remote decides,
and Forge and Jira store.

## What the split buys, and what it costs

A small, static form like this one could be built entirely in Forge.
Put the field list,
the options,
and the checks in the Forge app's backend,
and call it from the UI.
For many apps that's the right choice.
It removes a deployable,
a network hop,
and a whole class of "the service is down" failures.

A remote becomes worthwhile
when the form's logic naturally belongs somewhere else.
That might be when the options come from systems the team already runs,
when the rules are complex enough to want ordinary backend tooling and tests,
or when a different team owns the rules
and needs to ship them on its own schedule.
A Forge Remote is a normal server running
wherever the team already runs servers.
Forge functions run in a managed runtime
with its own limits on dependencies and outbound calls.

The split has real costs:

- **Network calls.**
  Every step, search, and save crosses a network boundary
  to a separately operated service.
- **Availability.**
  If the remote is unreachable,
  the form can't move forward.
  The UI reports that the form service is unavailable,
  because it has no local rules to fall back on.
- **Deployment and runtime dependencies.**
  The remote must be deployed,
  reachable at the base URL Forge is configured with,
  and able to verify Forge's requests
  (see [`DEVELOPMENT.md`](../../DEVELOPMENT.md)).
- **Coordination.**
  The Forge UI and the remote agree on a contract,
  not on shared code.
  Changes to that contract,
  such as a new descriptor property or a new kind of answer,
  need both sides to change together.

This sample leans on the remote
even where a form this small doesn't strictly need one,
because showing that pattern is its purpose.
It shows one way to divide the work,
not proof that every form needs a remote.

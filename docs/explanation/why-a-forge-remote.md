# Why the form logic lives in a Forge Remote

The most obvious way to build a Jira panel that asks a few ordered
questions is to put the field list, the option data, and the validation
rules directly in the Forge app: a resolver function, running in
Forge's own sandbox, that a Custom UI panel calls with `invoke`. This
sample deliberately doesn't do that. Instead, `apps/remote` is a
separate Fastify service, and the Forge app in `apps/forge` is a thin
client that calls it with `invokeRemote`. It's worth asking why.

## The sandbox is the wrong place for this kind of logic

Forge functions run in a managed, restricted runtime. That's a
reasonable trade for security and operational simplicity, but it means
the environment is not what most teams are used to reaching for when
building form or decision logic: no ambient database of their choosing,
no arbitrary outbound calls without egress permissions, a runtime and
dependency surface Forge controls. A Forge Remote is a normal server,
running wherever the team already runs servers, with the tooling,
libraries, and operational habits that already exist there. Pushing the
form's decision logic into the remote means it can be written, tested,
and evolved like ordinary backend code, and the Forge app's job shrinks
to "render what the remote says and save what the user confirmed."

This is a genuine trade-off, not a free win. A Forge Remote is another
deployable, another thing that can be down, and another network hop
between the Jira UI and the answer to "what's the next field." For a
form this small, a pure-Forge implementation would work fine, and for
many apps it's the right call. This sample exists specifically to show
the Forge Remote pattern, so it leans on it even where the form itself
doesn't strictly require the extra moving part.

## Why the API is stateless and read-only

Look at [`apps/remote/openapi.yaml`](../../apps/remote/openapi.yaml)
and notice what's missing: there's no endpoint to save anything, and no
server-side session. Every request carries the client's full `state`,
and the server answers a pure question — "given this state, what's
next, what's selectable, or is this valid?" — without remembering
anything between calls.

That design is a consequence of where persistence actually needs to
happen. The confirmed answer has to end up on the Jira issue, as an
entity property, guarded by Jira's own permission model
(`write:jira-work`). The remote has no privileged way to write that
property itself, and even if it did, duplicating Jira's authorization
and audit trail in a second system would be worse than not doing it.
So the remote is left with the part it's actually good at — deciding
field order, ranking selectable values, and validating a proposed
answer — and the Forge app, which already has the right permissions and
the user's session, does the one write that matters.

A side effect of statelessness is that the remote can be swapped,
scaled, or restarted without losing anything: there's no session to
lose. The cost is that every call re-sends the whole answer prefix, and
the remote re-validates it every time rather than trusting a session it
remembers. For a form with three fields, that's a non-issue. It's the
kind of trade-off worth revisiting if this pattern were used for a form
with dozens of interdependent fields.

## Why the client can't just cache the field list

It would be tempting to have the Forge app fetch the field list once
and drive the whole form from that, calling the remote only for option
search. The sample doesn't do this, and the reason is in
`evaluateFormState`
([`apps/remote/src/sample-form.ts`](../../apps/remote/src/sample-form.ts)):
field order, whether a field allows `null`, and which values are
currently valid are all things the *server* decides, and the server is
explicitly allowed to change its mind between two calls — a value that
was selectable a minute ago might not be by the time the client submits
it, and the server is the one that notices. A cached field list would
let the client silently drift out of sync with rules it doesn't own.
Asking the server "what's next?" on every step is the cost of keeping a
single source of truth for those rules, rather than letting two
services independently guess at them.

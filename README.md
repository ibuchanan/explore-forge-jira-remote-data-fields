# Jira text-properties Forge Remote stub

This repository is a minimal starting point for a Jira issue-context UI that will edit simple text issue properties through a Forge Remote.

## Current behavior

- The Forge app contributes a **Text properties** issue-context panel.
- The panel is intentionally a static **Not implemented.** stub.
- The Fastify remote registers its routes from an in-code OpenAPI specification through `fastify-openapi-glue`.
- `GET /form` and `POST /form` both fail closed with an RFC 9457-style `501 Not Implemented` response.

No Jira properties are read, written, or indexed yet. Consequently, the manifest requests no Jira OAuth scopes and has no `jira:entityProperty` module.

## Development

```bash
bun install
bun run --filter rovo-agent-connector-remote-backend check
```

Set `REMOTE_BASE_URL` to the public URL of the remote before deploying the Forge app. The manifest declares it as a compute remote endpoint at `/form`.

## Next implementation steps

1. Define the form schema and property keys in the OpenAPI specification.
2. Replace the static panel with a form that invokes the remote.
3. Add only the Jira scopes needed to persist the chosen properties.

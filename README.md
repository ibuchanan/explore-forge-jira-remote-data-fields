# Jira text-properties Forge Remote stub

This repository is a minimal starting point for a Jira issue-context UI that will edit simple text issue properties through a Forge Remote.

## Current behavior

- The Forge app contributes a **Text properties** issue-context panel.
- The panel is intentionally a static **Not implemented.** stub.
- The Fastify remote registers routes and request validation from [`apps/remote/openapi.yaml`](apps/remote/openapi.yaml) through `fastify-openapi-glue`.
- The contract's `POST /form/step`, `POST /fields/{fieldKey}/options`, and `POST /form/validate` operations currently fail closed with an RFC 9457-style `501 Not Implemented` response.

No Jira properties are read, written, or indexed yet. Consequently, the manifest requests no Jira OAuth scopes and has no `jira:entityProperty` module.

## Development

```bash
npm install
npm run --workspace=jira-remote-data-fields-backend check
```

Run `npm run forge:deploy:tunnel` to start the remote, expose it through a Cloudflare Quick Tunnel, set `REMOTE_BASE_URL`, and deploy the Forge app. Keep that command running while using the app. The manifest declares it as a compute remote endpoint; the Custom UI selects API routes such as `/form/step` with `invokeRemote`.

## Next implementation steps

1. Define the form schema and property keys in the OpenAPI specification.
2. Replace the static panel with a form that invokes the remote.
3. Add only the Jira scopes needed to persist the chosen properties.

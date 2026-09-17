# Development

This is a stub for a Jira text-properties UI backed by a Forge Remote.

## Validate the remote

```bash
npm install
npm run --workspace=jira-remote-data-fields-backend check
```

The Fastify server exposes `GET /form` and `POST /form`. Both deliberately return a `501 Not Implemented` problem response until the form contract is implemented.

## Deploy the Forge app

Set `REMOTE_BASE_URL` to an HTTPS URL for the remote and deploy the Forge workspace with the existing Forge scripts. The `jira:issueContext` module renders its static placeholder and routes remote resolver calls to `/form`.

No Jira property reads, writes, or JQL indexing are implemented. Add scopes and the relevant persistence code only when those capabilities are built.

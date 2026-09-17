# Development

This is a stub for a Jira text-properties UI backed by a Forge Remote.

## Validate the remote

```bash
npm install
npm run --workspace=jira-remote-data-fields-backend check
```

The Fastify server exposes `GET /form` and `POST /form`. Both deliberately return a `501 Not Implemented` problem response until the form contract is implemented.

## Deploy the Forge app

Run `npm run forge:deploy:tunnel` to start the remote, expose it through a Cloudflare Quick Tunnel, set `REMOTE_BASE_URL`, and deploy the Forge workspace. Keep that command running while exercising the app; it stops both the remote and tunnel on exit. The `jira:issueContext` module renders its static placeholder and routes remote resolver calls to `/form`.

For a tunnel without deployment, run `npm run remote:start` in one terminal and `bash scripts/tunnel.sh` in another.

No Jira property reads, writes, or JQL indexing are implemented. Add scopes and the relevant persistence code only when those capabilities are built.

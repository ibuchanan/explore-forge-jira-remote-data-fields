# Development

This guide is the developer entry point for trying the Forge code in this repository.

> **Important scope:** this repository currently demonstrates a Jira/JSM form backed by a Forge Remote. It does **not** declare or implement Forge's `graph:connector` module, Teamwork Graph ingestion, or a Rovo agent connector. The name in `secretspec.toml` is not evidence of that capability. To try the current sample end to end, follow the [tutorial](docs/tutorials/build-your-first-remote-data-field.md). To build a connector, start with the [Forge Teamwork Graph connector guide](https://developer.atlassian.com/platform/teamwork-graph/build-a-teamwork-graph-connector/) and the [official example apps](https://developer.atlassian.com/platform/teamwork-graph/teamwork-graph-api-example-apps/); do not treat this sample as a working connector.

## Prerequisites

- Node.js 24 and npm
- [Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/), authenticated to an Atlassian account
- A Jira Cloud site for registering and installing the sample
- [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/), [`secretspec`](https://secretspec.dev), and [`yq`](https://github.com/mikefarah/yq) for the registration/deploy workflow
- [Bun](https://bun.sh) for the Forge app build and tests

`npm run tools:check` checks the runtime tools used by the sample scripts. The wider repository checks also use `shellcheck`, `shfmt`, and `gitleaks`; dependencies such as `vacuum` and Lefthook are installed with the npm workspaces.

## Try the sample

From the repository root, install dependencies and check the required tools:

```bash
npm install
npm run tools:check
```

Registration requires a public HTTPS URL for the remote. Start `npm run --workspace=jira-remote-data-fields-backend start` and `cloudflared --no-autoupdate tunnel --url http://localhost:3000` in separate terminals. Save the tunnel URL with `bash scripts/env-var-set.sh REMOTE_BASE_URL https://your-tunnel.trycloudflare.com`, then run `bash scripts/register.sh`. Stop the temporary remote and tunnel. Run `npm run forge:deploy:tunnel` to start a fresh remote/tunnel, update `REMOTE_BASE_URL`, and deploy. Keep it running while testing. When the `default` secretspec profile is first used by `forge:deploy:tunnel`, enter `FORGE_SITE` if prompted. In another terminal, run `npm run forge:install`. A Quick Tunnel URL changes on restart, so redeploy after restarting the tunnel. See the [end-to-end tutorial](docs/tutorials/build-your-first-remote-data-field.md) for the steps in context.

## Repository map

- `apps/forge/` — Forge manifest and Custom UI app. `src/index.tsx` renders the remote-driven form; `src/host.ts` adapts create, issue-context, and portal-detail behavior; `src/triggers.ts` copies create-time form state to the Jira issue property.
- `apps/remote/` — Fastify Forge Remote. `openapi.yaml` defines the API; `src/sample-form.ts` contains the example fields, options, and decision logic; `src/server.ts` verifies Forge invocation tokens and implements the API handlers.
- `scripts/` and `test/` — registration, tunnel, and deploy helpers and their shell tests.
- `docs/` — Diátaxis-organized tutorial, how-to, explanations, and API reference.

The Forge app and remote are npm workspaces. The active modules and permissions are declared in [`apps/forge/manifest.yml`](apps/forge/manifest.yml). It currently contains Jira and JSM modules plus a Forge `endpoint` for the remote; it does not contain `graph:connector` or Rovo modules.

## Checks

Run the relevant workspace checks from the repository root:

```bash
npm run check
npm run test:scripts
npm run lint:docs
```

`npm run check` builds the Forge UI and runs each workspace's configured checks. `npm run test:scripts` tests the shell helpers. `npm run lint:docs` runs Markdown lint and spelling checks. The Forge workspace's `lint` script runs Biome and TypeScript checks; run its separate `lint:forge` script to validate the Forge manifest (requires a registered app and configured secrets):

```bash
npm run --workspace=jira-remote-data-fields-forge-app lint:forge
```

For individual workspace checks:

```bash
npm run --workspace=jira-remote-data-fields-forge-app check
npm run --workspace=jira-remote-data-fields-backend check
```

## Local iteration

To run only the remote, use `npm run remote:start`. It loads the `default` secretspec profile and starts the server on `http://localhost:3000`; expose it separately with `bash scripts/tunnel.sh` if needed. To change the sample form, edit `apps/remote/src/sample-form.ts` and follow [How to add a form field](docs/how-to/add-a-form-field.md).

To understand why the same form behaves differently across issue, create, and portal surfaces, see [One form across Jira and JSM surfaces](docs/explanation/one-form-across-host-surfaces.md). For contribution requirements, see [CONTRIBUTING.md](CONTRIBUTING.md).

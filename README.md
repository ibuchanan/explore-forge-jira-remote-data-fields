# Jira remote data fields (Forge Remote)

A sample Jira Forge app that shows how to keep form logic outside of
Forge, in a Forge Remote. The app renders a **Remote data fields**
issue-context panel with an ordered, type-ahead form (owning team,
priority, release train). A Fastify remote owns the field order, option
search, and validation; the Forge app only renders what the remote
returns and saves the confirmed answers as a Jira issue entity property.

## Status and ownership

- Status: experimental example app.
- Owner: [`ibuchanan`](.atlassian/OWNER).

## How it works

- The Forge app (`apps/forge`) contributes a `jira:issueContext` panel
  that calls the remote through `invokeRemote`, one step at a time, and
  saves the finished answers to the issue via a resolver
  (`saveTextProperties`).
- The remote (`apps/remote`) is a Fastify service whose routes and
  request validation come from
  [`apps/remote/openapi.yaml`](apps/remote/openapi.yaml) via
  `fastify-openapi-glue`: `POST /form/step`,
  `POST /fields/{fieldKey}/options`, and `POST /form/validate`.
  [`apps/remote/src/sample-form.ts`](apps/remote/src/sample-form.ts)
  holds the demo field definitions and selectable values — edit it to
  change the form.
- Confirmed answers are saved to the issue entity property
  `text-properties-form-state` and require the `write:jira-work` scope.

## Prerequisites

- Node.js v24 (see [`.nvmrc`](.nvmrc)) and npm.
- [Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/),
  with access to a Jira Cloud site to install into.
- [`cloudflared`][cloudflared], used to expose the local remote through
  a Quick Tunnel.
- [`secretspec`](https://secretspec.dev), used to manage the environment
  variables below.
- [`yq`](https://github.com/mikefarah/yq), used by `scripts/register.sh`
  to read the app ID out of the manifest.

Run `npm run tools:check` to confirm all four CLIs are on `PATH`.

[cloudflared]: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

## First-time setup

1. Install dependencies: `npm install`.
2. Register the Forge app once per site, then record the site and app ID with `secretspec`:

   ```bash
   bash scripts/register.sh
   ```

   This runs `forge register`, then writes the resulting `FORGE_APP_ID`
   with `secretspec`. You will also need to set `FORGE_SITE` (for
   example `example.atlassian.net`) the first time `secretspec` prompts
   for it.

## Run it

```bash
npm run forge:deploy:tunnel
```

This starts the remote, exposes it through a Cloudflare Quick Tunnel,
sets `REMOTE_BASE_URL` to the tunnel's public URL, and deploys the Forge
app. Keep it running while you use the app — it stops the remote and
tunnel together on exit. Open an issue in the target Jira site and look
for the **Remote data fields** panel.

To iterate on the remote without redeploying the Forge app, run
`npm run remote:start` in one terminal and `bash scripts/tunnel.sh` in
another.

## Development

See [`DEVELOPMENT.md`](DEVELOPMENT.md) for the inner development loop:
building and testing each workspace, linting, and the script test suite.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md), including Atlassian's CLA
requirement for external contributions.

## License

[Apache License 2.0](LICENSE).

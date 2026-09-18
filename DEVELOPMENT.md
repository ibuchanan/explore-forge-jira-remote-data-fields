# Development

This is an npm workspace with two packages: a Forge app (`apps/forge`) and
its Forge Remote (`apps/remote`). See [`README.md`](README.md) for what
the app does and how to run it end to end.

## Prerequisites

Everything in the [README's prerequisites](README.md#prerequisites), plus:

- [Bun](https://bun.sh), used to build `apps/forge` (`bun build`).
- [`vacuum`](https://quobix.com/vacuum/) (installed as a dependency of
  `apps/remote`), used to lint `apps/remote/openapi.yaml`.
- [`shellcheck`](https://www.shellcheck.net/) and
  [`shfmt`](https://github.com/mvdan/sh), used to lint and format
  `scripts/*.sh` and `test/*.sh`.
- [`gitleaks`](https://github.com/gitleaks/gitleaks), run by the pre-commit
  hook.
- [Lefthook](https://github.com/evilmartians/lefthook), which wires up the
  git hooks below (installed as part of `npm install`).

## Repository structure

- `apps/forge` — the Forge app: a `jira:issueContext` Custom UI panel
  (`src/index.tsx`) built with Atlaskit and `@forge/bridge`, plus a
  resolver (`src/resolvers.ts`) that saves confirmed form state to the
  issue entity property `text-properties-form-state`.
- `apps/remote` — the Forge Remote: a Fastify server (`src/server.ts`)
  that implements the OpenAPI contract in `openapi.yaml` using
  `fastify-openapi-glue`, backed by an in-memory sample form
  (`src/sample-form.ts`), with Forge Invocation Token verification in
  `src/forge-remote-auth.ts`.
- `scripts/` — bash scripts for registration, tunneling, deployment, and
  local tooling checks; each has a matching test in `test/`.
- `specs/` — design notes and a screenshot for this sample.
- `apps/forge/manifest.yml` — the Forge module wiring (endpoint,
  function, `jira:issueContext`) and the `write:jira-work` scope.

## Inner development loop

Install dependencies once from the repo root:

```bash
npm install
```

Run everything for one workspace with `check`, which runs format-check,
lint, typecheck, and test:

```bash
npm run --workspace=jira-remote-data-fields-backend check
npm run --workspace=jira-remote-data-fields-forge-app check
```

Or run a task across every workspace from the root: `npm run build`,
`npm run lint`, `npm run typecheck`, `npm run test`, `npm run format`.

To exercise the remote by itself, without Forge:

```bash
npm run remote:start
```

This loads secrets via `secretspec` (see `secretspec.toml`) and starts
the Fastify server on `http://localhost:3000`. Point a tunnel at it with
`bash scripts/tunnel.sh` in a second terminal if you need a public URL
without deploying the Forge app.

To deploy the Forge app against the tunneled remote in one step, use
`npm run forge:deploy:tunnel` (documented in the README) or
`npm run forge:deploy:tunnel:approve-system-user-change` if Forge reports
a system-user permission change to approve.

## Linting and formatting

- `npm run lint` runs each workspace's `lint` script. `apps/forge`'s
  lint also runs `forge lint`; `apps/remote`'s lint also runs
  `vacuum lint openapi.yaml` via Lefthook (`lefthook run lint-remote`).
- `npm run format` / `npm run format:check` format each workspace with
  Biome, plus `scripts/*.sh` and `test/*.sh` with `shfmt`
  (`format:scripts`) and check them with `shellcheck` (`lint:scripts`).
- Lefthook runs `gitleaks` and `npm run format` on `pre-commit`, and
  `npm run format:check`, `npm run lint`, and `npm run test` on
  `pre-push` (see `lefthook.yml`).

## Script tests

The bash scripts under `scripts/` have their own tests, runnable
individually or together:

```bash
npm run test:scripts
```

This runs `test/manifest.test.sh`, `test/tunnel.test.sh`,
`test/register.test.sh`, and `test/deploy-tunnel.test.sh` (twice, once
with `--approve-system-user-change`).

## Cleaning up

```bash
npm run clean
```

Removes `node_modules`, `package-lock.json`, and each workspace's build output.

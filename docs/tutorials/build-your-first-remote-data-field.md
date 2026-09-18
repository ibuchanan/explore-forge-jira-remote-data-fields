# Build your first remote data field

We will run the sample app end to end, then make one small change to the
form and watch it show up in Jira. By the end, you'll have deployed the
Forge app, filled in the **Remote data fields** panel, and taught the
form a new value.

## Before you start

You'll need the four CLIs checked by `npm run tools:check`: the Forge
CLI, `cloudflared`, `secretspec`, and `yq`. Run that command now. If any
CLI is missing, install it before continuing — the rest of this tutorial
assumes all four are on `PATH`.

## Step 1: Install and register

From the repo root, install dependencies:

```bash
npm install
```

Register the app against a Jira Cloud site you can install into:

```bash
bash scripts/register.sh
```

The first time this runs, `secretspec` will prompt you for `FORGE_SITE`
(for example `example.atlassian.net`). Enter it, and the script records
the resulting `FORGE_APP_ID` for you.

## Step 2: Deploy and open the panel

Start the remote, tunnel it, and deploy the Forge app in one step:

```bash
npm run forge:deploy:tunnel
```

Leave this running — it's serving the remote through the tunnel for as
long as it's up. In the Jira site you registered against, open any
issue. Look for the **Remote data fields** panel.

You'll see the panel ask for an **Owning team** first. Type a few
letters and pick one of the suggestions. Once you confirm it, the panel
moves on to **Priority**, then **Release train**. Confirm all three and
the panel shows your saved answers.

## Step 3: Look at where the form comes from

The panel didn't know about "Owning team" or "Priority" in advance — it
asked the remote. Open [`apps/remote/src/sample-form.ts`](../../apps/remote/src/sample-form.ts)
and find the `fields` array near the top. Each entry is one step of the
form, in the order the panel presented them: `team`, then `priority`,
then `releaseTrain`.

Just below `fields`, find `optionsByField`. This is where the selectable
values for `team` and `priority` live.

## Step 4: Teach the form a new value

Add a new team to the `team` list in `optionsByField`:

```ts
team: [
  "Account Experience",
  "Admin Experience",
  // ...
  "Sandbox Explorers",
  // ...
],
```

Save the file. Back in your terminal, stop `npm run forge:deploy:tunnel`
with `Ctrl+C`, then run it again:

```bash
npm run forge:deploy:tunnel
```

## Step 5: See your change

Reload the Jira issue and reopen the **Remote data fields** panel. Start
a fresh answer for **Owning team** and type "Sandbox". You'll see
**Sandbox Explorers** appear in the suggestions — the value you added is
now part of the live form.

You've now deployed the sample end to end and changed what the remote
serves. From here, [`DEVELOPMENT.md`](../../DEVELOPMENT.md) covers the
inner development loop for changing the app itself.

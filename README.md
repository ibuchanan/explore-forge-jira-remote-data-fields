# Jira remote data fields (Forge Remote)

[Atlassian explains this about Jira's custom fields](https://community.atlassian.com/learning/lesson/create-and-configure-custom-fields-in-jira):

> While system fields are the core of Jira,
> fields created by Jira admins enable your teams to capture data
> that is most relevant to them and use it in filters, automation, dashboards, and reporting.

[The available field types](https://support.atlassian.com/jira-cloud-administration/docs/field-types-you-can-create-as-a-jira-admin/) cover values Jira can validate itself. If a field needs to select from values provided by an external API, Jira doesn't have a configurable type that matches.

This Jira [Forge app](https://go.atlassian.com/forge) shows
how to keep UI rendering separate from form logic.
It renders an ordered, type-ahead **Remote data fields** form in Jira.
A Node.js remote service owns
the field order,
option search,
and validation;
the Forge app renders what the remote returns and saves confirmed answers as a Jira issue property.

## Try the sample

The shortest guided path installs the app, starts the remote and a Cloudflare Quick Tunnel, deploys the app, and exercises the **Remote data fields** panel:

1. Install Node.js 24, npm, the [Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/), [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/), [`secretspec`](https://secretspec.dev), and [`yq`](https://github.com/mikefarah/yq). Authenticate the Forge CLI and have a Jira Cloud site where you can register and install an app.
2. From the repository root, install dependencies and check the required tools:

   ```bash
   npm install
   npm run tools:check
   ```

3. Registration requires a public HTTPS URL for the remote. Start the remote with `npm run --workspace=jira-remote-data-fields-backend start` and expose port 3000 with `cloudflared --no-autoupdate tunnel --url http://localhost:3000` in separate terminals. In another terminal, save the printed URL and register:

   ```bash
   bash scripts/env-var-set.sh REMOTE_BASE_URL https://your-tunnel.trycloudflare.com
   bash scripts/register.sh
   ```

   On first use, `secretspec` prompts for `FORGE_SITE`.

4. Stop the temporary remote and tunnel. Run `npm run forge:deploy:tunnel` to start a fresh remote/tunnel and deploy. While it stays running, install the deployed app in another terminal with `npm run forge:install`, then open an issue and try **Remote data fields**. See the [tutorial](docs/tutorials/build-your-first-remote-data-field.md) for the full walkthrough and expected form behavior.

## What it demonstrates

- A Jira issue context panel and a Jira create-dialog custom field use one shared form UI.
- JSM request creation submits the form state to the host; the portal detail panel displays the captured state read-only.
- A Fastify remote provides ordered form steps, option search, and validation, specified in OpenAPI.
- Jira issue properties hold the post-creation form state.

This is sample code, not a production-ready connector. The current Forge manifest is the source of truth for the modules and scopes it declares.

## Documentation

- [Tutorial: build and run the sample](docs/tutorials/build-your-first-remote-data-field.md)
- [How-to: add a form field](docs/how-to/add-a-form-field.md)
- [Explanation: the Forge app and remote](docs/explanation/app-and-remote.md)
- [Explanation: one form across Jira and JSM surfaces](docs/explanation/one-form-across-host-surfaces.md)
- [Reference: form decision service API](docs/reference/form-decision-service-api.md)
- [Development: repository layout and inner loop](DEVELOPMENT.md)

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance, including the CLA requirement. Licensed under the [Apache License 2.0](LICENSE).

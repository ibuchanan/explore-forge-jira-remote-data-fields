import api, { getAppContext, route } from "@forge/api";

import {
  FORM_STATE_PROPERTY_KEY,
  findFormStateFieldId,
  formStateToCopy,
} from "./form-state";

type IssueCreatedEvent = { selfGenerated?: boolean; issue: { id: string } };
type IssueProperty = { value: unknown };

const jira = () => api.asApp();

async function readJson<T>(path: ReturnType<typeof route>, what: string) {
  const response = await jira().requestJira(path);
  if (response.status === 404) return undefined;
  if (!response.ok) {
    throw new Error(`Failed to read ${what} (status ${response.status}).`);
  }
  return (await response.json()) as T;
}

/** The create dialog's form state field value, if the field exists. */
async function readFieldValue(issueId: string): Promise<unknown> {
  const fields = await readJson<{ id: string }[]>(
    route`/rest/api/3/field`,
    "fields",
  );
  const fieldId = fields && findFormStateFieldId(fields);
  if (!fieldId) return undefined;
  const issue = await readJson<{ fields?: Record<string, unknown> }>(
    route`/rest/api/3/issue/${issueId}?fields=${fieldId}`,
    `issue ${issueId}`,
  );
  return issue?.fields?.[fieldId];
}

/** The property JSM stores for the portal request-create panel, keyed by app ID. */
async function readPortalProperty(issueId: string): Promise<unknown> {
  const { appId } = getAppContext().appAri;
  const property = await readJson<IssueProperty>(
    route`/rest/api/3/issue/${issueId}/properties/${appId}`,
    `the portal request property on issue ${issueId}`,
  );
  return property?.value;
}

/**
 * Copies form state captured at creation, by the create dialog's custom field
 * or the portal request-create panel, to the form state issue property that
 * the post-create panels read and write. Decisions live in `form-state.ts`;
 * this handler only does the Jira I/O.
 */
export async function copyFormStateOnCreate(
  event: IssueCreatedEvent,
): Promise<void> {
  if (event.selfGenerated) return;
  const issueId = event.issue.id;

  const fieldValue = await readFieldValue(issueId);
  const portalProperty =
    fieldValue == null ? await readPortalProperty(issueId) : undefined;

  const copy = formStateToCopy(event, { fieldValue, portalProperty });
  if (copy.action === "skip") {
    if (copy.reason === "invalid") {
      console.warn(`Issue ${issueId} has invalid form state from creation.`);
    }
    return;
  }

  const putResponse = await jira().requestJira(
    route`/rest/api/3/issue/${issueId}/properties/${FORM_STATE_PROPERTY_KEY}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copy.state),
    },
  );
  if (!putResponse.ok) {
    throw new Error(
      `Failed to copy form state to issue ${issueId} (status ${putResponse.status}).`,
    );
  }
}

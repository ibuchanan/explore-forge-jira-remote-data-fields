import api, { route } from "@forge/api";

import {
  FORM_STATE_PROPERTY_KEY,
  findFormStateFieldId,
  formStateToCopy,
} from "./form-state";

type IssueCreatedEvent = { selfGenerated?: boolean; issue: { id: string } };

/**
 * Copies form state submitted through the create dialog's custom field to the
 * form state issue property, which the post-create panels read and write.
 * Decisions live in `form-state.ts`; this handler only does the Jira I/O.
 */
export async function copyFormStateOnCreate(
  event: IssueCreatedEvent,
): Promise<void> {
  const jira = api.asApp();

  const fieldsResponse = await jira.requestJira(route`/rest/api/3/field`);
  if (!fieldsResponse.ok) {
    throw new Error(`Failed to list fields (status ${fieldsResponse.status}).`);
  }
  const fieldId = findFormStateFieldId(await fieldsResponse.json());
  if (!fieldId) return;

  const issueId = event.issue.id;
  const issueResponse = await jira.requestJira(
    route`/rest/api/3/issue/${issueId}?fields=${fieldId}`,
  );
  if (!issueResponse.ok) {
    throw new Error(
      `Failed to read issue ${issueId} (status ${issueResponse.status}).`,
    );
  }

  const copy = formStateToCopy(event, await issueResponse.json(), fieldId);
  if (copy.action === "skip") {
    if (copy.reason === "invalid") {
      console.warn(`Issue ${issueId} has invalid form state in ${fieldId}.`);
    }
    return;
  }

  const putResponse = await jira.requestJira(
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

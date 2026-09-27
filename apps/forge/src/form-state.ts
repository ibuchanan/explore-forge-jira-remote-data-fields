/** The ordered set of answers for the remote data fields on one Jira work item. */
export type FormState = Record<string, string | null>;

/** Issue (and portal request) entity property that stores the confirmed form state. */
export const FORM_STATE_PROPERTY_KEY = "remote-data-fields-form-state";

export function isFormState(value: unknown): value is FormState {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (answer) => answer === null || typeof answer === "string",
    )
  );
}

/** Module key of the `jira:customField` that carries form state through issue create. */
export const FORM_STATE_FIELD_MODULE_KEY = "remote-data-fields-value";

type JiraField = { id: string; schema?: { custom?: string } };

/**
 * Finds the `customfield_*` ID Jira assigned to this app's form state field.
 * Forge fields report their extension ARI, ending in `/static/<module-key>`,
 * as `schema.custom` in `GET /rest/api/3/field`.
 */
export function findFormStateFieldId(fields: JiraField[]): string | undefined {
  return fields.find((field) =>
    field.schema?.custom?.endsWith(`/static/${FORM_STATE_FIELD_MODULE_KEY}`),
  )?.id;
}

type IssueCreatedEvent = { selfGenerated?: boolean };
type JiraIssue = { fields?: Record<string, unknown> };

export type FormStateCopy =
  | { action: "copy"; state: FormState }
  | { action: "skip"; reason: "empty" | "invalid" | "self-generated" };

/**
 * Decides whether a newly created issue's form state field should be copied
 * to the form state issue property read by the post-create panels.
 */
export function formStateToCopy(
  event: IssueCreatedEvent,
  issue: JiraIssue,
  fieldId: string,
): FormStateCopy {
  if (event.selfGenerated) return { action: "skip", reason: "self-generated" };
  const value = issue.fields?.[fieldId];
  if (value == null) return { action: "skip", reason: "empty" };
  if (!isFormState(value)) return { action: "skip", reason: "invalid" };
  return { action: "copy", state: value };
}

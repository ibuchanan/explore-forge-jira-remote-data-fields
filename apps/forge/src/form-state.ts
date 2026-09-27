/** The ordered set of answers for the remote data fields on one Jira work item. */
export type FormState = Record<string, string | null>;

/**
 * Issue entity property that stores the confirmed form state. It is also the
 * field key the portal request-create panel submits under.
 */
export const FORM_STATE_PROPERTY_KEY = "remote-data-fields-form-state";

/**
 * The form state inside a portal request property. JSM stores request-create
 * submissions as `{ [field key]: value }` under an issue property named after
 * the app ID, and exposes the same object as `request.property`.
 */
export function portalFormStateValue(property: unknown): unknown {
  if (!property || typeof property !== "object") return undefined;
  return (property as Record<string, unknown>)[FORM_STATE_PROPERTY_KEY];
}

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

/** Where a newly created issue may carry form state captured at creation. */
export type CreatedFormState = {
  /** The create dialog's form state field value. */
  fieldValue?: unknown;
  /** The property the portal request-create panel submitted. */
  portalProperty?: unknown;
};

export type FormStateCopy =
  | { action: "copy"; state: FormState }
  | { action: "skip"; reason: "empty" | "invalid" | "self-generated" };

/**
 * Decides whether form state captured at creation, by the create dialog's
 * field or the portal request-create panel, should be copied to the form state
 * issue property read by the post-create panels.
 */
export function formStateToCopy(
  event: IssueCreatedEvent,
  created: CreatedFormState,
): FormStateCopy {
  if (event.selfGenerated) return { action: "skip", reason: "self-generated" };
  const value =
    created.fieldValue ?? portalFormStateValue(created.portalProperty);
  if (value == null) return { action: "skip", reason: "empty" };
  if (!isFormState(value)) return { action: "skip", reason: "invalid" };
  return { action: "copy", state: value };
}

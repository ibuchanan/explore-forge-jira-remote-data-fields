import {
  FORM_STATE_PROPERTY_KEY,
  type FormState,
  isFormState,
  portalFormStateValue,
} from "./form-state";

const PORTAL_REQUEST_CREATE_PROPERTY_PANEL =
  "jiraServiceManagement:portalRequestCreatePropertyPanel";
const PORTAL_REQUEST_DETAIL = "jiraServiceManagement:portalRequestDetail";

/** The subset of the Forge extension context this app branches on. */
export type Extension = {
  type?: string;
  renderContext?: string;
  fieldValue?: unknown;
  issue?: { id?: string };
  request?: { property?: unknown };
};

/** What to pass to `view.submit`, or `undefined` when the host takes no submission. */
export type HostSubmission = { payload: unknown } | undefined;

export function hostSubmission(
  extension: Extension,
  state: FormState,
  isValid: boolean,
): HostSubmission {
  if (extension.type === PORTAL_REQUEST_CREATE_PROPERTY_PANEL) {
    return {
      payload: {
        fields: [{ key: FORM_STATE_PROPERTY_KEY, value: state }],
        isValid,
      },
    };
  }
  if (isIssueCreateField(extension)) {
    return { payload: isValid ? state : null };
  }
  return undefined;
}

function isIssueCreateField(extension: Extension): boolean {
  return (
    extension.type === "jira:customField" &&
    extension.renderContext === "issue-create"
  );
}

/**
 * Whether the surface only shows the answers captured at creation. Portal
 * customers typically cannot read or write issue properties, so the portal
 * request view shows the request property JSM provides instead.
 */
export function isReadOnly(extension: Extension): boolean {
  return extension.type === PORTAL_REQUEST_DETAIL;
}

/**
 * The form state to start from, or `undefined` when the surface should load
 * the saved form state from the issue property instead.
 */
export function initialState(extension: Extension): FormState | undefined {
  if (isReadOnly(extension)) {
    const value = portalFormStateValue(extension.request?.property);
    return isFormState(value) ? value : {};
  }
  if (!isIssueCreateField(extension)) return undefined;
  return isFormState(extension.fieldValue) ? extension.fieldValue : {};
}

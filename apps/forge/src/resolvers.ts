import api, { route } from "@forge/api";
import Resolver from "@forge/resolver";

import {
  FORM_STATE_PROPERTY_KEY,
  type FormState,
  isFormState,
} from "./form-state";

type SaveRemoteDataFieldsPayload = { state: FormState };
type IssueProperty = { value: unknown };

const resolver = new Resolver();

resolver.define<undefined, FormState | null>(
  "getRemoteDataFields",
  async ({ context }) => {
    const issueId = (
      context.extension as { issue?: { id: string } } | undefined
    )?.issue?.id;
    if (!issueId) return null;

    const response = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/issue/${issueId}/properties/${FORM_STATE_PROPERTY_KEY}`,
      );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(
        `Failed to load the form state (status ${response.status}).`,
      );
    }

    const { value } = (await response.json()) as IssueProperty;
    if (!isFormState(value)) {
      throw new Error("The saved form state has an invalid format.");
    }
    return value;
  },
);

resolver.define<SaveRemoteDataFieldsPayload, void>(
  "saveRemoteDataFields",
  async ({ payload, context }) => {
    const issueId = (context.extension as { issue: { id: string } }).issue.id;
    const response = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/issue/${issueId}/properties/${FORM_STATE_PROPERTY_KEY}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload.state),
        },
      );
    if (!response.ok) {
      throw new Error(
        `Failed to save the form state (status ${response.status}).`,
      );
    }
  },
);

export const handler = resolver.getDefinitions();

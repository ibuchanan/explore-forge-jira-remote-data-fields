import api, { route } from "@forge/api";
import Resolver from "@forge/resolver";

const ENTITY_PROPERTY_KEY = "text-properties-form-state";

type SaveTextPropertiesPayload = { state: Record<string, string | null> };

const resolver = new Resolver();

resolver.define<SaveTextPropertiesPayload, void>(
  "saveTextProperties",
  async ({ payload, context }) => {
    const issueId = (context.extension as { issue: { id: string } }).issue.id;
    const response = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/issue/${issueId}/properties/${ENTITY_PROPERTY_KEY}`,
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

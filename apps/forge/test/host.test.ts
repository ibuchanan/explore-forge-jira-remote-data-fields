import { describe, expect, test } from "bun:test";

import { hostSubmission, initialState } from "../src/host";

const issueCreateField = {
  type: "jira:customField",
  entryPoint: "edit",
  fieldId: "customfield_10123",
  renderContext: "issue-create",
  experience: "issue-create",
};

describe("hostSubmission", () => {
  test("submits validated form state as the create dialog's field value", () => {
    expect(
      hostSubmission(
        issueCreateField,
        { team: "Jira", releaseTrain: null },
        true,
      ),
    ).toEqual({ payload: { team: "Jira", releaseTrain: null } });
  });

  test("clears the create dialog's field value while the form is not valid", () => {
    expect(hostSubmission(issueCreateField, { team: "Jira" }, false)).toEqual({
      payload: null,
    });
  });

  test("submits the portal request-create property with its validity", () => {
    const portalCreatePanel = {
      type: "jiraServiceManagement:portalRequestCreatePropertyPanel",
    };
    expect(hostSubmission(portalCreatePanel, { team: "Jira" }, false)).toEqual({
      payload: {
        fields: [
          { key: "remote-data-fields-form-state", value: { team: "Jira" } },
        ],
        isValid: false,
      },
    });
  });

  test.each([
    ["the issue context panel", { type: "jira:issueContext" }],
    [
      "the portal request detail panel",
      { type: "jiraServiceManagement:portalRequestDetailPanel" },
    ],
    [
      "the custom field outside the create dialog",
      { ...issueCreateField, renderContext: "issue-view" },
    ],
  ])("hands nothing to the host in %s", (_, extension) => {
    expect(hostSubmission(extension, { team: "Jira" }, true)).toBeUndefined();
  });
});

describe("initialState", () => {
  test("resumes from the create dialog's existing field value", () => {
    expect(
      initialState({ ...issueCreateField, fieldValue: { team: "Jira" } }),
    ).toEqual({ team: "Jira" });
  });

  test.each([
    ["is empty", null],
    ["is not form state", { team: 42 }],
  ])(
    "starts the create dialog empty when the field value %s",
    (_, fieldValue) => {
      expect(initialState({ ...issueCreateField, fieldValue })).toEqual({});
    },
  );

  test("leaves other surfaces to load their saved state", () => {
    expect(initialState({ type: "jira:issueContext" })).toBeUndefined();
  });
});

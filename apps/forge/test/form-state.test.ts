import { describe, expect, test } from "bun:test";

import {
  findFormStateFieldId,
  formStateToCopy,
  isFormState,
} from "../src/form-state";

describe("isFormState", () => {
  test("accepts answers that are strings or explicit nulls", () => {
    expect(isFormState({ team: "Jira", releaseTrain: null })).toBe(true);
  });

  test.each([
    ["null", null],
    ["an array", ["Jira"]],
    ["a string", "Jira"],
    ["an object with a non-string answer", { team: 42 }],
  ])("rejects %s", (_, value) => {
    expect(isFormState(value)).toBe(false);
  });
});

describe("findFormStateFieldId", () => {
  const summaryField = {
    id: "summary",
    key: "summary",
    name: "Summary",
    custom: false,
    schema: { type: "string", system: "summary" },
  };
  const formStateField = {
    id: "customfield_10123",
    key: "customfield_10123",
    name: "Remote data fields",
    custom: true,
    schema: {
      type: "any",
      custom:
        "ari:cloud:ecosystem::extension/91e76e8d-752b-417d-8586-71679349e07b/7d1c6a52-2f0e-4c8b-9b3e-2f6f1f0d1a11/static/remote-data-fields-value",
      customId: 10123,
    },
  };

  test("finds the ID of the app's form state custom field", () => {
    expect(findFormStateFieldId([summaryField, formStateField])).toBe(
      "customfield_10123",
    );
  });

  test("finds nothing when the field has not been created", () => {
    expect(findFormStateFieldId([summaryField])).toBeUndefined();
  });

  test("ignores another app's field with a similar module key", () => {
    const lookalike = {
      ...formStateField,
      id: "customfield_10999",
      schema: {
        ...formStateField.schema,
        custom:
          "ari:cloud:ecosystem::extension/other-app/other-env/static/remote-data-fields-value-v2",
      },
    };
    expect(findFormStateFieldId([lookalike])).toBeUndefined();
  });
});

describe("formStateToCopy", () => {
  const fieldId = "customfield_10123";
  const createdEvent = {
    eventType: "avi:jira:created:issue",
    selfGenerated: false,
    issue: { id: "10042", key: "DEMO-7" },
  };

  test("copies the form state submitted in the create dialog", () => {
    const issue = {
      id: "10042",
      key: "DEMO-7",
      fields: { [fieldId]: { team: "Jira", releaseTrain: null } },
    };
    expect(formStateToCopy(createdEvent, issue, fieldId)).toEqual({
      action: "copy",
      state: { team: "Jira", releaseTrain: null },
    });
  });

  test("skips issues created without the form state field", () => {
    const issue = { id: "10042", key: "DEMO-7", fields: { [fieldId]: null } };
    expect(formStateToCopy(createdEvent, issue, fieldId)).toEqual({
      action: "skip",
      reason: "empty",
    });
  });

  test("skips a field value that is not form state", () => {
    const issue = {
      id: "10042",
      key: "DEMO-7",
      fields: { [fieldId]: { team: ["Jira"] } },
    };
    expect(formStateToCopy(createdEvent, issue, fieldId)).toEqual({
      action: "skip",
      reason: "invalid",
    });
  });

  test("skips issues the app created itself", () => {
    const issue = {
      id: "10042",
      key: "DEMO-7",
      fields: { [fieldId]: { team: "Jira" } },
    };
    const selfGenerated = { ...createdEvent, selfGenerated: true };
    expect(formStateToCopy(selfGenerated, issue, fieldId)).toEqual({
      action: "skip",
      reason: "self-generated",
    });
  });
});

import { describe, expect, test } from "bun:test";

import {
  findFormStateFieldId,
  formStateToCopy,
  isFormState,
  portalFormStateValue,
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

describe("portalFormStateValue", () => {
  test("reads the form state the portal request-create panel submitted", () => {
    expect(
      portalFormStateValue({
        "remote-data-fields-form-state": { team: "Jira" },
      }),
    ).toEqual({ team: "Jira" });
  });

  test.each([
    ["is missing", undefined],
    ["is not an object", "Jira"],
    ["has no form state field", { other: { team: "Jira" } }],
  ])("finds nothing when the property %s", (_, property) => {
    expect(portalFormStateValue(property)).toBeUndefined();
  });
});

describe("formStateToCopy", () => {
  const createdEvent = {
    eventType: "avi:jira:created:issue",
    selfGenerated: false,
    issue: { id: "10042", key: "DEMO-7" },
  };
  const portalProperty = (value: unknown) => ({
    "remote-data-fields-form-state": value,
  });

  test("copies the form state submitted in the create dialog", () => {
    expect(
      formStateToCopy(createdEvent, {
        fieldValue: { team: "Jira", releaseTrain: null },
      }),
    ).toEqual({ action: "copy", state: { team: "Jira", releaseTrain: null } });
  });

  test("copies the form state submitted in the portal request-create panel", () => {
    expect(
      formStateToCopy(createdEvent, {
        fieldValue: null,
        portalProperty: portalProperty({ team: "Jira" }),
      }),
    ).toEqual({ action: "copy", state: { team: "Jira" } });
  });

  test("prefers the create dialog's field value over a portal property", () => {
    expect(
      formStateToCopy(createdEvent, {
        fieldValue: { team: "Jira" },
        portalProperty: portalProperty({ team: "Confluence" }),
      }),
    ).toEqual({ action: "copy", state: { team: "Jira" } });
  });

  test("skips issues created without form state", () => {
    expect(
      formStateToCopy(createdEvent, {
        fieldValue: null,
        portalProperty: undefined,
      }),
    ).toEqual({ action: "skip", reason: "empty" });
  });

  test.each([
    ["field value", { fieldValue: { team: ["Jira"] } }],
    ["portal property", { portalProperty: portalProperty({ team: 42 }) }],
  ])("skips a %s that is not form state", (_, created) => {
    expect(formStateToCopy(createdEvent, created)).toEqual({
      action: "skip",
      reason: "invalid",
    });
  });

  test("skips issues the app created itself", () => {
    const selfGenerated = { ...createdEvent, selfGenerated: true };
    expect(
      formStateToCopy(selfGenerated, { fieldValue: { team: "Jira" } }),
    ).toEqual({ action: "skip", reason: "self-generated" });
  });
});

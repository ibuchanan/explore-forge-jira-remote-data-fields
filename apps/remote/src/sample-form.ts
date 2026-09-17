export type FormState = Record<string, string | null>;

export type Field = {
  allowsNull: boolean;
  description?: string;
  key: string;
  label: string;
  minimumQueryLength: number;
  nullLabel?: string;
  placeholder?: string;
};

export type FormStep =
  | { complete: false; field: Field; state: FormState }
  | { complete: true; state: FormState };

export type FormStateProblem = {
  detail: string;
  errors: Array<{ detail: string; fieldKey?: string; type: string }>;
  firstInvalidFieldKey?: string;
  status: 422;
  title: string;
  type: string;
};

// Edit this definition to change the demonstration form and its selectable values.
const fields: Field[] = [
  {
    key: "team",
    label: "Owning team",
    description: "Which team owns this work?",
    placeholder: "Search teams",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  {
    key: "priority",
    label: "Priority",
    description: "Choose the expected urgency.",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  {
    key: "releaseTrain",
    label: "Release train",
    description: "Optional planning classification.",
    placeholder: "Search release trains",
    minimumQueryLength: 1,
    allowsNull: true,
    nullLabel: "Not planned for a release",
  },
];

const optionsByField: Record<string, string[]> = {
  // More than 25 entries deliberately exercise the client's truncated-search UX.
  team: [
    "Account Experience",
    "Admin Experience",
    "Analytics",
    "Atlas",
    "Automation",
    "Bitbucket",
    "Cloud Foundations",
    "Commerce",
    "Compass",
    "Confluence",
    "Customer Support",
    "Data Platform",
    "Developer Experience",
    "Ecosystem",
    "Enterprise Readiness",
    "Finance Systems",
    "Forge",
    "Identity",
    "Infrastructure",
    "Jira",
    "Knowledge Management",
    "Loom",
    "Mobile",
    "Observability",
    "Operations",
    "Performance",
    "Platform Engineering",
    "Rovo",
    "Security",
    "Service Management",
  ],
  priority: ["Low", "Medium", "High", "Critical"],
  releaseTrain: ["2026.10", "2026.11", "2026.12", "2027.01"],
};

const maxOptions = 25;

function problem(
  detail: string,
  fieldKey?: string,
  type = "urn:example:text-properties:invalid-form-state",
): FormStateProblem {
  return {
    type: "urn:example:text-properties:invalid-form-state",
    title: "Invalid form state",
    status: 422,
    detail,
    ...(fieldKey ? { firstInvalidFieldKey: fieldKey } : {}),
    errors: [{ type, detail, ...(fieldKey ? { fieldKey } : {}) }],
  };
}

export function isFormStateProblem(
  result: unknown,
): result is FormStateProblem {
  return (
    typeof result === "object" &&
    result !== null &&
    "status" in result &&
    result.status === 422
  );
}

export function evaluateFormState(
  state: FormState,
): FormStep | FormStateProblem {
  const unknownKey = Object.keys(state).find(
    (key) => !fields.some((field) => field.key === key),
  );
  if (unknownKey) return problem(`Unknown field: ${unknownKey}.`, unknownKey);

  for (const field of fields) {
    if (!(field.key in state)) {
      const laterAnswer = fields
        .slice(fields.indexOf(field) + 1)
        .find((laterField) => laterField.key in state);
      if (laterAnswer) {
        return problem(
          `Answer ${field.label} before ${laterAnswer.label}.`,
          field.key,
          "urn:example:text-properties:out-of-order-answer",
        );
      }
      return { complete: false, field, state };
    }

    const answer = state[field.key];
    if (answer === undefined) {
      return problem(`${field.label} requires a value.`, field.key);
    }
    if (answer === null) {
      if (!field.allowsNull) {
        return problem(`${field.label} requires a value.`, field.key);
      }
      continue;
    }
    const fieldOptions = optionsByField[field.key] ?? [];
    if (!fieldOptions.includes(answer)) {
      return problem(`Select a valid ${field.label} value.`, field.key);
    }
  }

  return { complete: true, state };
}

export function searchOptions(
  fieldKey: string,
  state: FormState,
  query: string,
): { options: string[]; truncated: boolean } | FormStateProblem | undefined {
  const field = fields.find((candidate) => candidate.key === fieldKey);
  if (!field) return undefined;

  const step = evaluateFormState(state);
  if (isFormStateProblem(step)) return step;
  if (step.complete || step.field.key !== fieldKey) {
    return problem(
      `Field ${fieldKey} is not the next available field.`,
      fieldKey,
    );
  }
  if (query.length < field.minimumQueryLength) {
    return problem(
      `Enter at least ${field.minimumQueryLength} character${field.minimumQueryLength === 1 ? "" : "s"} to search ${field.label}.`,
      fieldKey,
      "urn:example:text-properties:query-too-short",
    );
  }

  const matches = (optionsByField[fieldKey] ?? []).filter((option) =>
    option.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return {
    options: matches.slice(0, maxOptions),
    truncated: matches.length > maxOptions,
  };
}

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

// Core fields appear on every form. Type selects the context fields that follow.
const coreFields: Field[] = [
  {
    key: "customer",
    label: "Customer",
    description: "Who is this request for?",
    placeholder: "Search example customers",
    minimumQueryLength: 1,
    allowsNull: false,
  },
  {
    key: "requestType",
    label: "Request type",
    description: "Choose the broad kind of request.",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  {
    key: "type",
    label: "Type",
    description: "Choose a subtype to show relevant details.",
    placeholder: "Search types",
    minimumQueryLength: 1,
    allowsNull: false,
  },
];

const contextFields: Record<string, Field> = {
  accessPermissions: {
    key: "accessPermissions",
    label: "Access permissions",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  channel: {
    key: "channel",
    label: "Channel",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  country: {
    key: "country",
    label: "Country",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  countryAccess: {
    key: "countryAccess",
    label: "Country access",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  countryRemoval: {
    key: "countryRemoval",
    label: "Country removal",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  customerCategory: {
    key: "customerCategory",
    label: "Customer category",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  dataInput: {
    key: "dataInput",
    label: "Data input",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  dataOutput: {
    key: "dataOutput",
    label: "Data output",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  dataProcessing: {
    key: "dataProcessing",
    label: "Data processing",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  distributor: {
    key: "distributor",
    label: "Distributor",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  escalationOrigin: {
    key: "escalationOrigin",
    label: "Escalation origin",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  feature: {
    key: "feature",
    label: "Feature",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  headquarters: {
    key: "headquarters",
    label: "Headquarters",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  loadReason: {
    key: "loadReason",
    label: "Load reason",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  organizationalUnit: {
    key: "organizationalUnit",
    label: "Organizational unit",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  period: {
    key: "period",
    label: "Period",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  periodicity: {
    key: "periodicity",
    label: "Periodicity",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  preventiveMeasures: {
    key: "preventiveMeasures",
    label: "Preventive measures",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  product: {
    key: "product",
    label: "Product",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  project: {
    key: "project",
    label: "Project",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  region: {
    key: "region",
    label: "Region",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  retailCustomer: {
    key: "retailCustomer",
    label: "Retail customer",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  role: {
    key: "role",
    label: "Role",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  rootCause: {
    key: "rootCause",
    label: "Root-cause analysis",
    minimumQueryLength: 0,
    allowsNull: false,
  },
  workspace: {
    key: "workspace",
    label: "Workspace",
    minimumQueryLength: 0,
    allowsNull: false,
  },
};

const contextByType: Record<string, string[]> = {
  Access: [
    "accessPermissions",
    "countryAccess",
    "countryRemoval",
    "organizationalUnit",
    "role",
    "workspace",
  ],
  Customer: ["customerCategory", "headquarters", "retailCustomer"],
  Data: [
    "channel",
    "country",
    "dataInput",
    "dataOutput",
    "dataProcessing",
    "distributor",
    "loadReason",
    "period",
    "periodicity",
    "product",
    "region",
  ],
  Escalation: [
    "escalationOrigin",
    "feature",
    "preventiveMeasures",
    "rootCause",
  ],
  Project: ["project", "workspace"],
  Publishing: ["accessPermissions", "channel", "country", "product", "region"],
};

const optionsByField: Record<string, string[]> = {
  // More than 25 entries deliberately exercise the client's truncated-search UX.
  customer: Array.from(
    { length: 30 },
    (_, index) => `Example Customer ${String(index + 1).padStart(2, "0")}`,
  ),
  requestType: ["Question", "Change request", "Support request"],
  type: Object.keys(contextByType),
  accessPermissions: ["Read only", "Read and write", "Administrator"],
  channel: ["Web portal", "API integration", "Secure file transfer"],
  country: [
    "Australia",
    "Brazil",
    "Canada",
    "France",
    "Germany",
    "Japan",
    "United Kingdom",
    "United States",
  ],
  countryAccess: [
    "Australia",
    "Brazil",
    "Canada",
    "France",
    "Germany",
    "Japan",
    "United Kingdom",
    "United States",
  ],
  countryRemoval: [
    "Australia",
    "Brazil",
    "Canada",
    "France",
    "Germany",
    "Japan",
    "United Kingdom",
    "United States",
  ],
  customerCategory: ["Enterprise", "Mid-market", "Small business"],
  dataInput: ["File upload", "API integration", "Secure file transfer"],
  dataOutput: ["Dashboard", "Data export", "Summary report"],
  dataProcessing: [
    "Standard processing",
    "Priority processing",
    "Scheduled processing",
  ],
  distributor: [
    "Example Distribution North",
    "Example Distribution Central",
    "Example Distribution South",
  ],
  escalationOrigin: [
    "Customer support",
    "Monitoring alert",
    "Internal referral",
  ],
  feature: ["Data import", "Access control", "Reporting"],
  headquarters: ["North America", "Europe", "Asia Pacific"],
  loadReason: ["Initial setup", "Scheduled refresh", "Data correction"],
  organizationalUnit: ["Operations", "Sales", "Research", "Support"],
  period: ["Current month", "Previous month", "Custom period"],
  periodicity: ["One-time", "Daily", "Weekly", "Monthly"],
  preventiveMeasures: [
    "Additional monitoring",
    "Validation checks",
    "User guidance",
  ],
  product: ["Analytics platform", "Data workspace", "Reporting service"],
  project: [
    "Example Project Alpha",
    "Example Project Beta",
    "Example Project Gamma",
  ],
  region: ["North America", "South America", "Europe", "Asia Pacific"],
  retailCustomer: [
    "Example Retailer North",
    "Example Retailer Central",
    "Example Retailer South",
  ],
  role: ["Viewer", "Contributor", "Administrator"],
  rootCause: [
    "Configuration issue",
    "Data quality issue",
    "Service interruption",
  ],
  workspace: [
    "Example Workspace One",
    "Example Workspace Two",
    "Example Workspace Three",
  ],
};

function fieldsForState(state: FormState): Field[] {
  return [
    ...coreFields,
    ...(contextByType[state.type ?? ""] ?? []).flatMap((key) => {
      const field = contextFields[key];
      return field ? [field] : [];
    }),
  ];
}

const maxOptions = 25;

function problem(
  detail: string,
  fieldKey?: string,
  type = "urn:example:remote-data-fields:invalid-form-state",
): FormStateProblem {
  return {
    type: "urn:example:remote-data-fields:invalid-form-state",
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
  const fields = fieldsForState(state);
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
          "urn:example:remote-data-fields:out-of-order-answer",
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
  const field = fieldsForState(state).find(
    (candidate) => candidate.key === fieldKey,
  );
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
      "urn:example:remote-data-fields:query-too-short",
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

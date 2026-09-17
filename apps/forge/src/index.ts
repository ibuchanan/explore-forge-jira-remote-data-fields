import { invokeRemote, view } from "@forge/bridge";

type FormState = Record<string, string | null>;

type Field = {
  allowsNull: boolean;
  description?: string;
  key: string;
  label: string;
  minimumQueryLength: number;
  nullLabel?: string;
  placeholder?: string;
};

type NextFieldStep = { complete: false; field: Field; state: FormState };
type CompleteFormStep = { complete: true; state: FormState };
type FormStep = NextFieldStep | CompleteFormStep;
type OptionSearchResult = { options: string[]; truncated: boolean };
type ProblemDetails = { detail?: string; title?: string };

function getRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("The app root is missing.");
  return root;
}

const root = getRoot();

let state: FormState = {};
let step: FormStep | undefined;
let options: string[] = [];
let loading = false;
let error: string | undefined;
let searchSequence = 0;

void view.theme.enable();

function problemMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const problem = body as ProblemDetails;
    return problem.detail ?? problem.title ?? fallback;
  }
  return fallback;
}

async function callRemote<T>(
  path: string,
  body: object,
): Promise<{ body?: T; status: number }> {
  try {
    return (await invokeRemote({
      path,
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    })) as { body?: T; status: number };
  } catch (cause) {
    console.error("Forge Remote invocation failed", cause);
    throw new Error(
      "The form service is unavailable. Confirm the remote and tunnel are running, then try again.",
    );
  }
}

function setBusy(isLoading: boolean) {
  loading = isLoading;
  render();
}

async function evaluate(nextState: FormState) {
  setBusy(true);
  error = undefined;
  options = [];
  try {
    const response = await callRemote<FormStep>("/form/step", {
      state: nextState,
    });
    if (response.status !== 200 || !response.body) {
      throw new Error(
        problemMessage(response.body, "The form state could not be evaluated."),
      );
    }
    state = response.body.state;
    step = response.body;
  } catch (cause) {
    error =
      cause instanceof Error
        ? cause.message
        : "The form state could not be evaluated.";
  } finally {
    setBusy(false);
  }
}

async function validate() {
  setBusy(true);
  error = undefined;
  try {
    const response = await callRemote<ProblemDetails>("/form/validate", {
      state,
    });
    if (response.status !== 204) {
      throw new Error(
        problemMessage(response.body, "The completed form is no longer valid."),
      );
    }
  } catch (cause) {
    error =
      cause instanceof Error
        ? cause.message
        : "The completed form could not be validated.";
  } finally {
    setBusy(false);
  }
}

async function search(query: string) {
  if (!step || step.complete || query.length < step.field.minimumQueryLength) {
    options = [];
    render();
    return;
  }

  const sequence = ++searchSequence;
  try {
    const response = await callRemote<OptionSearchResult>(
      `/fields/${encodeURIComponent(step.field.key)}/options`,
      { state, query },
    );
    if (sequence !== searchSequence) return;
    if (response.status !== 200 || !response.body) {
      throw new Error(
        problemMessage(response.body, "Options could not be loaded."),
      );
    }
    options = response.body.options;
    error = undefined;
  } catch (cause) {
    if (sequence !== searchSequence) return;
    options = [];
    error =
      cause instanceof Error ? cause.message : "Options could not be loaded.";
  }
  render();
}

function button(
  label: string,
  action: () => void,
  disabled = false,
  kind = "secondary",
) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `button ${kind}`;
  element.disabled = disabled;
  element.textContent = label;
  element.addEventListener("click", action);
  return element;
}

function render() {
  root.replaceChildren();
  const container = document.createElement("section");
  container.className = "form";

  if (error) {
    const message = document.createElement("p");
    message.className = "message error";
    message.role = "alert";
    message.textContent = error;
    container.append(message);
  }

  const answers = Object.entries(state);
  if (answers.length) {
    const summary = document.createElement("ol");
    summary.className = "answers";
    for (const [key, value] of answers) {
      const item = document.createElement("li");
      item.textContent = `${key}: ${value ?? "No value"}`;
      summary.append(item);
    }
    container.append(summary);
  }

  if (!step) {
    const message = document.createElement("p");
    message.textContent = loading
      ? "Loading form…"
      : "The form could not be loaded.";
    container.append(message);
  } else if (step.complete) {
    const message = document.createElement("p");
    message.className = "message success";
    message.textContent = "All answers are complete and ready for validation.";
    container.append(
      message,
      button(
        loading ? "Validating…" : "Validate",
        () => void validate(),
        loading,
        "primary",
      ),
    );
  } else {
    const { field } = step;
    const label = document.createElement("label");
    label.htmlFor = "field-search";
    label.textContent = field.label;
    container.append(label);

    if (field.description) {
      const description = document.createElement("p");
      description.className = "description";
      description.textContent = field.description;
      container.append(description);
    }

    const input = document.createElement("input");
    input.id = "field-search";
    input.type = "search";
    input.placeholder = field.placeholder ?? "Search options";
    input.disabled = loading;
    input.autocomplete = "off";
    input.addEventListener("input", () => void search(input.value));
    container.append(input);

    if (field.minimumQueryLength > 0) {
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = `Enter at least ${field.minimumQueryLength} character${field.minimumQueryLength === 1 ? "" : "s"} to search.`;
      container.append(hint);
    }

    const choices = document.createElement("div");
    choices.className = "choices";
    for (const option of options) {
      choices.append(
        button(
          option,
          () => void evaluate({ ...state, [field.key]: option }),
          loading,
        ),
      );
    }
    if (field.allowsNull && field.nullLabel) {
      choices.append(
        button(
          field.nullLabel,
          () => void evaluate({ ...state, [field.key]: null }),
          loading,
        ),
      );
    }
    container.append(choices);
  }

  if (answers.length && !loading) {
    container.append(
      button("Change previous answer", () => {
        const previous = { ...state };
        delete previous[answers.at(-1)?.[0] ?? ""];
        void evaluate(previous);
      }),
    );
  }
  root.append(container);
}

render();
void evaluate({});

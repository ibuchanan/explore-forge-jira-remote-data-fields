import "@atlaskit/css-reset";

import Button from "@atlaskit/button";
import { Box, Stack, Text } from "@atlaskit/primitives";
import SectionMessage from "@atlaskit/section-message";
import { AsyncSelect } from "@atlaskit/select";
import { invoke, invokeRemote, view } from "@forge/bridge";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

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
type FieldOption = { label: string; value: string };

const NULL_OPTION_VALUE = "__null__";

function getRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("The app root is missing.");
  return root;
}

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

function App() {
  const [state, setState] = useState<FormState>({});
  const [step, setStep] = useState<FormStep>();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const searchSequence = useRef(0);

  async function evaluate(nextState: FormState) {
    setLoading(true);
    setError(undefined);
    setSaved(false);
    try {
      const response = await callRemote<FormStep>("/form/step", {
        state: nextState,
      });
      if (response.status !== 200 || !response.body) {
        throw new Error(
          problemMessage(
            response.body,
            "The form state could not be evaluated.",
          ),
        );
      }
      setState(response.body.state);
      setStep(response.body);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The form state could not be evaluated.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    setError(undefined);
    try {
      const response = await callRemote<ProblemDetails>("/form/validate", {
        state,
      });
      if (response.status !== 204) {
        throw new Error(
          problemMessage(
            response.body,
            "The completed form is no longer valid.",
          ),
        );
      }
      await invoke("saveTextProperties", { state });
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The completed form could not be saved.",
      );
    } finally {
      setLoading(false);
    }
  }

  function nullOption(field: Field): FieldOption[] {
    return field.allowsNull && field.nullLabel
      ? [{ label: field.nullLabel, value: NULL_OPTION_VALUE }]
      : [];
  }

  async function loadOptions(query: string): Promise<FieldOption[]> {
    if (!step || step.complete) return [];
    const pinned = nullOption(step.field);
    if (query.length < step.field.minimumQueryLength) {
      return pinned;
    }

    const sequence = ++searchSequence.current;
    try {
      const response = await callRemote<OptionSearchResult>(
        `/fields/${encodeURIComponent(step.field.key)}/options`,
        { state, query },
      );
      if (sequence === searchSequence.current) {
        if (response.status !== 200 || !response.body) {
          throw new Error(
            problemMessage(response.body, "Options could not be loaded."),
          );
        }
        setError(undefined);
        return [
          ...pinned,
          ...response.body.options.map((option) => ({
            label: option,
            value: option,
          })),
        ];
      }
    } catch (cause) {
      if (sequence === searchSequence.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Options could not be loaded.",
        );
      }
    }
    return pinned;
  }

  // Load the first field once on mount; `evaluate` is recreated every render
  // but the initial-load call intentionally never needs to re-run.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-once effect
  useEffect(() => {
    void evaluate({});
  }, []);

  const answers = Object.entries(state);

  return (
    <Stack space="space.100">
      {error && (
        <SectionMessage appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
      )}

      {answers.length > 0 && (
        <Box as="ol" paddingBlockStart="space.0" paddingInlineStart="space.300">
          {answers.map(([key, value]) => (
            <li key={key}>
              <Text>
                {key}: {value ?? "No value"}
              </Text>
            </li>
          ))}
        </Box>
      )}

      {!step ? (
        <Text>
          {loading ? "Loading form…" : "The form could not be loaded."}
        </Text>
      ) : step.complete ? (
        <Stack space="space.100">
          <SectionMessage appearance={saved ? "success" : "information"}>
            <Text>
              {saved
                ? "Saved to this issue."
                : "All answers are complete. Save to store them on this issue."}
            </Text>
          </SectionMessage>
          <Box>
            <Button
              appearance="primary"
              isDisabled={loading || saved}
              onClick={() => void save()}
            >
              {loading ? "Saving…" : saved ? "Saved" : "Save"}
            </Button>
          </Box>
        </Stack>
      ) : (
        <Stack space="space.100">
          <Stack space="space.150">
            <label htmlFor="field-search">
              <Text weight="bold">{step.field.label}</Text>
            </label>
            {step.field.description && (
              <Text color="color.text.subtle">{step.field.description}</Text>
            )}
          </Stack>

          <AsyncSelect<FieldOption>
            key={step.field.key}
            inputId="field-search"
            placeholder={step.field.placeholder ?? "Search options"}
            isDisabled={loading}
            isLoading={loading}
            defaultOptions={nullOption(step.field)}
            loadOptions={loadOptions}
            styles={{
              control: (base) => ({ ...base, borderWidth: 2 }),
            }}
            onChange={(selected) =>
              selected &&
              void evaluate({
                ...state,
                [step.field.key]:
                  selected.value === NULL_OPTION_VALUE ? null : selected.value,
              })
            }
          />
        </Stack>
      )}

      {answers.length > 0 && !loading && (
        <Box>
          <Button
            onClick={() => {
              const previous = { ...state };
              delete previous[answers.at(-1)?.[0] ?? ""];
              void evaluate(previous);
            }}
          >
            Change previous answer
          </Button>
        </Box>
      )}
    </Stack>
  );
}

createRoot(getRoot()).render(<App />);

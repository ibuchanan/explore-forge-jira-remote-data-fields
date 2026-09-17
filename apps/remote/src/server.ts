import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import fastify, { type FastifyReply } from "fastify";
import openapiGlue from "fastify-openapi-glue";
import type { ForgeRemoteAuthHookOptions } from "./forge-remote-auth.js";
import { forgeRemoteAuthHook } from "./forge-remote-auth.js";
import {
  evaluateFormState,
  type FormState,
  isFormStateProblem,
  searchOptions,
} from "./sample-form.js";

const localSpecification = fileURLToPath(
  new URL("../openapi.yaml", import.meta.url),
);
const specification = existsSync(localSpecification)
  ? localSpecification
  : fileURLToPath(new URL("../../openapi.yaml", import.meta.url));

type FormStateRequest = { body: { state: FormState } };
type OptionSearchRequest = {
  body: { query: string; state: FormState };
  params: { fieldKey: string };
};

function sendFormStateResult(
  reply: FastifyReply,
  result: ReturnType<typeof evaluateFormState>,
) {
  if (isFormStateProblem(result)) {
    return reply.code(422).type("application/problem+json").send(result);
  }
  return reply.send(result);
}

export function createServer(auth: ForgeRemoteAuthHookOptions = {}) {
  const app = fastify();
  app.addHook("onRequest", forgeRemoteAuthHook(auth));
  app.register(openapiGlue, {
    specification,
    serviceHandlers: {
      evaluateFormStep: (request: FormStateRequest, reply: FastifyReply) =>
        sendFormStateResult(reply, evaluateFormState(request.body.state)),
      searchFieldOptions: (
        request: OptionSearchRequest,
        reply: FastifyReply,
      ) => {
        const result = searchOptions(
          request.params.fieldKey,
          request.body.state,
          request.body.query,
        );
        if (!result) {
          return reply
            .code(404)
            .type("application/problem+json")
            .send({
              type: "urn:example:text-properties:unknown-field",
              title: "Unknown field",
              status: 404,
              detail: `Unknown field: ${request.params.fieldKey}.`,
            });
        }
        if (isFormStateProblem(result)) {
          return reply.code(422).type("application/problem+json").send(result);
        }
        return reply.send(result);
      },
      validateFormState: (request: FormStateRequest, reply: FastifyReply) => {
        const result = evaluateFormState(request.body.state);
        if (isFormStateProblem(result)) {
          return reply.code(422).type("application/problem+json").send(result);
        }
        if (!result.complete) {
          return reply
            .code(422)
            .type("application/problem+json")
            .send({
              type: "urn:example:text-properties:incomplete-form",
              title: "Incomplete form state",
              status: 422,
              detail: `Answer ${result.field.label} before validating the form.`,
              firstInvalidFieldKey: result.field.key,
              errors: [
                {
                  type: "urn:example:text-properties:incomplete-form",
                  fieldKey: result.field.key,
                  detail: `Answer ${result.field.label} before validating the form.`,
                },
              ],
            });
        }
        return reply.code(204).send();
      },
    },
  });
  return app;
}

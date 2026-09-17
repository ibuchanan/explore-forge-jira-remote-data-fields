import { fileURLToPath } from "node:url";

import fastify, { type FastifyReply } from "fastify";
import openapiGlue from "fastify-openapi-glue";

const specification = fileURLToPath(new URL("../../openapi.yaml", import.meta.url));

function notImplemented(reply: FastifyReply) {
  return reply.code(501).type("application/problem+json").send({
    type: "about:blank",
    title: "Not Implemented",
    status: 501,
    detail: "Not implemented",
  });
}

export function createServer() {
  const app = fastify();
  app.register(openapiGlue, {
    specification,
    serviceHandlers: {
      evaluateFormStep: (_request: unknown, reply: FastifyReply) =>
        notImplemented(reply),
      searchFieldOptions: (_request: unknown, reply: FastifyReply) =>
        notImplemented(reply),
      validateFormState: (_request: unknown, reply: FastifyReply) =>
        notImplemented(reply),
    },
  });
  return app;
}

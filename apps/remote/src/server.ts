import fastify, { type FastifyReply } from "fastify";
import openapiGlue from "fastify-openapi-glue";

const specification = {
  openapi: "3.0.3",
  info: { title: "Text properties API", version: "0.0.0" },
  paths: {
    "/form": {
      get: {
        operationId: "getForm",
        responses: { 501: { description: "Not implemented" } },
      },
      post: {
        operationId: "submitForm",
        responses: { 501: { description: "Not implemented" } },
      },
    },
  },
};

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
      getForm: (_request: unknown, reply: FastifyReply) =>
        notImplemented(reply),
      submitForm: (_request: unknown, reply: FastifyReply) =>
        notImplemented(reply),
    },
  });
  return app;
}

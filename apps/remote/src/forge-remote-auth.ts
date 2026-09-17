import {
  type ForgeRemoteContext,
  toHttpAuthFailureResponse,
  type ValidateAuthHeaderOptions,
  validateForgeRemoteRequest,
} from "@forge-ahead/remote";
import type { FastifyRequest, onRequestAsyncHookHandler } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    forgeRemoteContext?: ForgeRemoteContext;
  }
}

export interface ForgeRemoteAuthHookOptions extends ValidateAuthHeaderOptions {
  systemTokenHeader?: string;
  userTokenHeader?: string;
}

function readHeader(
  headers: FastifyRequest["headers"],
  headerName: string,
): string | undefined {
  const value = headers[headerName.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

/** Validates FITs and makes the verified Forge context available to routes. */
export function forgeRemoteAuthHook(
  options: ForgeRemoteAuthHookOptions = {},
): onRequestAsyncHookHandler {
  const systemTokenHeader = options.systemTokenHeader ?? "x-forge-oauth-system";
  const userTokenHeader = options.userTokenHeader ?? "x-forge-oauth-user";

  return async (request, reply) => {
    const authorization = readHeader(request.headers, "authorization");
    const appSystemToken = readHeader(request.headers, systemTokenHeader);
    const appUserToken = readHeader(request.headers, userTokenHeader);
    const result = await validateForgeRemoteRequest({
      ...options,
      headers: {
        ...(authorization === undefined ? {} : { authorization }),
        ...(appSystemToken === undefined ? {} : { appSystemToken }),
        ...(appUserToken === undefined ? {} : { appUserToken }),
      },
    });

    if (result.isErr()) {
      const { status, body } = toHttpAuthFailureResponse(result.error);
      reply.code(status).send(body);
      return;
    }

    request.forgeRemoteContext = result.value;
  };
}

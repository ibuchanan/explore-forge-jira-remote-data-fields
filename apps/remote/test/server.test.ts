import assert from "node:assert/strict";
import test from "node:test";

import { generateKeyPair, SignJWT } from "jose";

import { createServer } from "../src/server.js";

const requests = [
  { name: "form-step evaluation", url: "/form/step", payload: { state: {} } },
  {
    name: "field-option search",
    url: "/fields/team/options",
    payload: { state: {}, query: "" },
  },
  { name: "form validation", url: "/form/validate", payload: { state: {} } },
];

async function createAuthenticatedServer() {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const token = await new SignJWT({ app: { id: "test-app" } })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer("forge/invocation-token")
    .setAudience("test-app")
    .setExpirationTime("1h")
    .sign(privateKey);

  return {
    authorization: `Bearer ${token}`,
    server: createServer({ jwks: async () => publicKey }),
  };
}

for (const { name, url, payload } of requests) {
  test(`returns a standard not-implemented problem for ${name}`, async () => {
    const { authorization, server } = await createAuthenticatedServer();
    const response = await server.inject({
      method: "POST",
      url,
      headers: { authorization },
      payload,
    });

    assert.equal(response.statusCode, 501);
    assert.deepEqual(response.json(), {
      type: "about:blank",
      title: "Not Implemented",
      status: 501,
      detail: "Not implemented",
    });
  });
}

test("rejects requests without a Forge Invocation Token", async () => {
  const response = await createServer().inject({
    method: "POST",
    url: "/form/step",
    payload: { state: {} },
  });

  assert.equal(response.statusCode, 401);
});

test("validates authenticated requests against the OpenAPI schema", async () => {
  const { authorization, server } = await createAuthenticatedServer();
  const response = await server.inject({
    method: "POST",
    url: "/form/step",
    headers: { authorization },
    payload: {},
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.json().message, /must have required property 'state'/);
});

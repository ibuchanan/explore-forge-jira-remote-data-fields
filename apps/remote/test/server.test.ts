import assert from "node:assert/strict";
import test from "node:test";

import { generateKeyPair, SignJWT } from "jose";

import { createServer } from "../src/server.js";

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

async function post(
  url: string,
  payload: object,
): Promise<Awaited<ReturnType<ReturnType<typeof createServer>["inject"]>>> {
  const { authorization, server } = await createAuthenticatedServer();
  return server.inject({
    method: "POST",
    url,
    headers: { authorization },
    payload,
  });
}

test("starts the sample form with the customer field", async () => {
  const response = await post("/form/step", { state: {} });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    complete: false,
    state: {},
    field: {
      key: "customer",
      label: "Customer",
      description: "Who is this request for?",
      placeholder: "Search example customers",
      minimumQueryLength: 1,
      allowsNull: false,
    },
  });
});

test("limits broad customer searches to 25 options", async () => {
  const response = await post("/fields/customer/options", {
    state: {},
    query: "example",
  });
  const body = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(body.options.length, 25);
  assert.equal(body.truncated, true);
  assert.deepEqual(body.options.slice(0, 3), [
    "Example Customer 01",
    "Example Customer 02",
    "Example Customer 03",
  ]);
});

test("returns a focused customer search without truncation", async () => {
  const response = await post("/fields/customer/options", {
    state: {},
    query: "customer 03",
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    options: ["Example Customer 03"],
    truncated: false,
  });
});

test("selecting a type reveals its matching context fields", async () => {
  const response = await post("/form/step", {
    state: {
      customer: "Example Customer 01",
      requestType: "Support request",
      type: "Escalation",
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().field.key, "escalationOrigin");
  assert.equal(response.json().field.label, "Escalation origin");
});

test("accepts a complete escalation form", async () => {
  const state = {
    customer: "Example Customer 01",
    requestType: "Support request",
    type: "Escalation",
    escalationOrigin: "Monitoring alert",
    feature: "Reporting",
    preventiveMeasures: "Additional monitoring",
    rootCause: "Configuration issue",
  };

  const step = await post("/form/step", { state });
  const validation = await post("/form/validate", { state });

  assert.deepEqual(step.json(), { complete: true, state });
  assert.equal(validation.statusCode, 204);
});

test("rejects out-of-order answers", async () => {
  const response = await post("/form/step", { state: { type: "Escalation" } });

  assert.equal(response.statusCode, 422);
  assert.equal(response.json().firstInvalidFieldKey, "customer");
  assert.match(response.json().detail, /Customer/);
});

test("rejects searches for an unknown field", async () => {
  const response = await post("/fields/unknown/options", {
    state: {},
    query: "",
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().title, "Unknown field");
});

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

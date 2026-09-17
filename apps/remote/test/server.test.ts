import assert from "node:assert/strict";
import test from "node:test";

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

for (const { name, url, payload } of requests) {
  test(`returns a standard not-implemented problem for ${name}`, async () => {
    const response = await createServer().inject({
      method: "POST",
      url,
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

test("validates requests against the OpenAPI schema", async () => {
  const response = await createServer().inject({
    method: "POST",
    url: "/form/step",
    payload: {},
  });

  assert.equal(response.statusCode, 400);
  assert.match(response.json().message, /must have required property 'state'/);
});

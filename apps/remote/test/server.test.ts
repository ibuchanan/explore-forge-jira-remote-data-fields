import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "../src/server.js";

test("returns a standard not-implemented problem for form reads", async () => {
  const response = await createServer().inject({ method: "GET", url: "/form" });

  assert.equal(response.statusCode, 501);
  const problem = response.json();
  assert.equal(problem.title, "Not Implemented");
  assert.equal(problem.status, 501);
  assert.equal(problem.detail, "Not implemented");
  assert.equal(problem.type, "about:blank");
});

test("returns a standard not-implemented problem for form submissions", async () => {
  const response = await createServer().inject({
    method: "POST",
    url: "/form",
  });

  assert.equal(response.statusCode, 501);
  assert.equal(response.json().detail, "Not implemented");
});

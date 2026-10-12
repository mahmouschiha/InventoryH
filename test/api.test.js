const test = require("node:test");
const assert = require("node:assert/strict");

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

test("health endpoint returns a consistent JSON response", async () => {
  const response = await fetch(`${BASE}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.status, "ok");
});

test("items endpoint returns data and metadata", async () => {
  const response = await fetch(`${BASE}/api/items`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
  assert.equal(body.meta.count, body.data.length);
});

test("invalid product data returns HTTP 400 with JSON error", async () => {
  const response = await fetch(`${BASE}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "", sku: "", quantity: -1, price: -3, category: "" })
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.details));
});

test("unknown product returns HTTP 404", async () => {
  const response = await fetch(`${BASE}/api/items/999999`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.success, false);
});

// server/__tests__/integration/places.integration.test.js
// Integration tests for /api/places with a temporary test fixture.

const request = require("supertest");
const express = require("express");
const placesRoutes = require("../../src/routes/placesRoutes");
const db = require("../../src/config/db");
const fixtureName = `CI Place ${Date.now()}`;
let fixtureId;

const app = express();
app.use(express.json());
app.use("/api/places", placesRoutes);

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "integration-test-secret";
  const result = await db.query(
    "INSERT INTO places (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING id",
    [fixtureName, 7.29, 80.63]
  );
  fixtureId = result.rows[0].id;
});

afterAll(async () => {
  if (fixtureId) await db.query("DELETE FROM places WHERE id = $1", [fixtureId]);
});

describe("GET /api/places", () => {
  test("returns 200 with an array of places", async () => {
    const res = await request(app).get("/api/places");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(res.body.data.length);
  });

  test("each place has required fields", async () => {
    const res = await request(app).get("/api/places").query({ search: fixtureName });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      expect.objectContaining({ id: fixtureId, name: fixtureName }),
    ]);
  });
});

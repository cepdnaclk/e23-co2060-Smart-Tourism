// server/__tests__/integration/places.integration.test.js
// Integration tests for /api/places (read-only, safe to run on seeded DB)

const request = require("supertest");
const express = require("express");
const placesRoutes = require("../../src/routes/placesRoutes");

const app = express();
app.use(express.json());
app.use("/api/places", placesRoutes);

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "integration-test-secret";
});

describe("GET /api/places", () => {
  test("returns 200 with an array of places", async () => {
    const res = await request(app).get("/api/places");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("each place has required fields", async () => {
    const res = await request(app).get("/api/places");
    if (res.body.length > 0) {
      const place = res.body[0];
      expect(place).toHaveProperty("id");
      expect(place).toHaveProperty("name");
    }
  });
});

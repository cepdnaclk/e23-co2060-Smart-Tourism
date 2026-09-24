// server/__tests__/integration/auth.integration.test.js
// Integration tests for /api/auth endpoints against a REAL PostgreSQL DB.
// The CI pipeline starts a postgres service container before running these.

const request = require("supertest");
const express = require("express");
const authRoutes = require("../../src/routes/authRoutes");

// Build a minimal express app with only the auth routes
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

// Set up env before module loads
beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "integration-test-secret";
});

// Generate a unique e-mail so tests are idempotent on the same DB
const uniqueEmail = `test_${Date.now()}@smarttourism.test`;

describe("POST /api/auth/register", () => {
  test("registers a new tourist successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      full_name: "CI Test User",
      email: uniqueEmail,
      password: "Test@12345",
      role: "tourist",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual(expect.objectContaining({
      id: expect.any(Number), email: uniqueEmail, role: "tourist",
    }));
  });

  test("rejects duplicate registration", async () => {
    await request(app).post("/api/auth/register").send({
      full_name: "CI Test User",
      email: uniqueEmail,
      password: "Test@12345",
      role: "tourist",
    });

    const res = await request(app).post("/api/auth/register").send({
      full_name: "CI Test User",
      email: uniqueEmail,
      password: "Test@12345",
      role: "tourist",
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/auth/login", () => {
  test("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: uniqueEmail,
      password: "Test@12345",
    });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("token");
  });

  test("rejects wrong password with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: uniqueEmail,
      password: "WrongPassword",
    });

    expect(res.status).toBe(401);
  });

  test("rejects non-existent user with 401 or 404", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@nowhere.test",
      password: "irrelevant",
    });

    expect([401, 404]).toContain(res.status);
  });
});

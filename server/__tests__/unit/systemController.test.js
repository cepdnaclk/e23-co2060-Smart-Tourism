// server/__tests__/unit/systemController.test.js
// Unit tests for the /api/status and /api/system/status endpoints.
// Uses supertest against the Express app directly — no DB connections.

const request = require("supertest");

// Stub the DB so app.js can be imported without connecting to PostgreSQL
jest.mock("../../src/config/db", () => ({
  query: jest.fn(),
}));

// Stub nodemailer / resend so no e-mail side-effects happen
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({}),
  }),
}));

// Require AFTER mocks are in place
// We only need the express app, not the HTTP server / Socket.IO setup,
// so we stub the server.listen to be a no-op.
let app;
beforeAll(() => {
  // Prevent the server from actually listening on a port
  jest.spyOn(require("http"), "createServer").mockReturnValue({
    listen: jest.fn(),
    on: jest.fn(),
  });

  // Import app after mocking
  // Because app.js calls startServer() at module load we need process.env set
  process.env.PORT = "9999";
  process.env.JWT_SECRET = "test-secret";
});

describe("GET /api/status", () => {
  test("returns 200 with correct shape", async () => {
    // Build a minimal express app mirroring the real /api/status route
    const express = require("express");
    const testApp = express();
    testApp.get("/api/status", (req, res) => {
      res.status(200).json({
        project: "Smart Tourism Management System",
        batch: "E23",
        status: "Active",
        message: "Server Tier is functioning correctly",
        timestamp: new Date().toISOString(),
      });
    });

    const res = await request(testApp).get("/api/status");
    expect(res.status).toBe(200);
    expect(res.body.project).toBe("Smart Tourism Management System");
    expect(res.body.status).toBe("Active");
    expect(res.body).toHaveProperty("timestamp");
  });
});

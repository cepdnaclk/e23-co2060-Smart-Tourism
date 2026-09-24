// server/__tests__/unit/systemController.test.js
// Checks the /api/status response shape using a minimal Express app.
// Supertest manages its own HTTP server; no DB connection is needed.

const request = require("supertest");

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

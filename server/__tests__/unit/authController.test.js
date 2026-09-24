// server/__tests__/unit/authController.test.js
// Unit tests for auth utilities (JWT, password hashing).
// These tests NEVER connect to a database.

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

describe("Auth – password hashing", () => {
  test("bcrypt.hash produces a valid hash", async () => {
    const hash = await bcrypt.hash("password123", 10);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe("password123");
  });

  test("bcrypt.compare returns true for correct password", async () => {
    const hash = await bcrypt.hash("password123", 10);
    const match = await bcrypt.compare("password123", hash);
    expect(match).toBe(true);
  });

  test("bcrypt.compare returns false for wrong password", async () => {
    const hash = await bcrypt.hash("password123", 10);
    const match = await bcrypt.compare("wrong", hash);
    expect(match).toBe(false);
  });
});

describe("Auth – JWT", () => {
  const secret = process.env.JWT_SECRET;

  test("jwt.sign produces a token string", () => {
    const token = jwt.sign({ userId: 1, role: "tourist" }, secret, {
      expiresIn: "1h",
    });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  test("jwt.verify decodes correct payload", () => {
    const token = jwt.sign({ userId: 42, role: "admin" }, secret, {
      expiresIn: "1h",
    });
    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).toBe(42);
    expect(decoded.role).toBe("admin");
  });

  test("jwt.verify throws on tampered token", () => {
    const token = jwt.sign({ userId: 1 }, secret) + "tampered";
    expect(() => jwt.verify(token, secret)).toThrow();
  });
});

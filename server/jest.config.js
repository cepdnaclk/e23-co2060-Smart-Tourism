/**
 * Jest configuration for SERVER tests.
 * Separates unit (no DB) from integration (needs DB) via --testPathPattern.
 *
 * Usage:
 *   npm run test:unit        → runs __tests__/unit/**
 *   npm run test:integration → runs __tests__/integration/**
 */

module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/__tests__/**/*.test.js",
    "**/__tests__/**/*.spec.js",
  ],
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/database/migrations/**",
    "!src/database/seedData.js",
    "!src/database/resetDb.js",
  ],
  // Give each test file up to 30 s (integration tests hit a real DB)
  testTimeout: 30000,
  // Suppress console.log spam from app.js during tests
  silent: false,
  verbose: true,
};

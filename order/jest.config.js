/**
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/**/index.js"],
  verbose: true,
  maxWorkers: 1, // Run tests serially to avoid database race conditions
};

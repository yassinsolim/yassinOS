module.exports = require("next/jest")()({
  moduleDirectories: ["<rootDir>", "node_modules"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
});

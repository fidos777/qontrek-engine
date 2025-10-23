import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["__tests__/**/*.test.ts?(x)"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // Mock native dependencies in CI to avoid building binaries
      ...(process.env.CI && {
        sqlite: path.resolve(__dirname, "./__mocks__/sqlite.ts"),
        sqlite3: path.resolve(__dirname, "./__mocks__/sqlite3.ts"),
      }),
    },
  },
});

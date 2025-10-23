import { defineConfig } from "vitest/config";
import path from "path";

const isCI = process.env.CI === "true";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["__tests__/**/*.test.ts?(x)"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      ...(isCI ? {
        'sqlite3': path.resolve(__dirname, './tests/__mocks__/emptyModule.ts'),
        'sqlite': path.resolve(__dirname, './tests/__mocks__/emptyModule.ts'),
      } : {}),
    },
  },
});

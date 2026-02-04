import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
    exclude: ["node_modules", "dist"]
  },
  resolve: {
    alias: {
      "@domain": resolve(__dirname, "src/domain"),
      "@backend": resolve(__dirname, "src/implementation/backend"),
      "@frontend": resolve(__dirname, "src/implementation/frontend"),
      "@shared": resolve(__dirname, "src/implementation/shared"),
      "@dependencies": resolve(__dirname, "src/dependencies"),
      "@presentation": resolve(__dirname, "src/presentation"),
      "@test": resolve(__dirname, "src/test")
    }
  }
})
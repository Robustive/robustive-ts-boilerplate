import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify"
import { resolve } from "node:path"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development"
  return {
    root: "../../",
    define: {
      __VUE_PROD_DEVTOOLS__: isDevelopment
    },
    plugins: [
      vue({
        template: { transformAssetUrls }
      }),
      // @see: https://www.npmjs.com/package/vite-plugin-vuetify
      vuetify()
    ],
    resolve: {
      alias: {
        "@domain": resolve(__dirname, "../../src/domain"),
        "@frontend": resolve(__dirname, "../../src/implementation/frontend"),
        "@shared": resolve(__dirname, "../../src/implementation/shared"),
        "@presentation": resolve(__dirname, "../../src/presentation")
      }
    },
    build: {
      outDir: "dist/frontend",
      sourcemap: true,
      minify: !isDevelopment
    }
  }
})

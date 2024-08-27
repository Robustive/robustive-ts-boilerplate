import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  root: "../../",
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    // @see: https://www.npmjs.com/package/vite-plugin-vuetify
    vuetify()
  ],
  resolve: {
    alias: {
      "@domain": "/src/domain",
      "@frontend": "/src/implementation/frontend",
      "@shared": "/src/implementation/shared",
      "@presentation": "/src/presentation",
    }
  },
  build: {
    outDir: "dist/frontend",
    sourcemap: true
  }
})

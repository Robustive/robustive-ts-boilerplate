import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"
import eslintConfigPrettier from "eslint-config-prettier"

export default [
  { files: ["**/*.{js,mjs,cjs,ts,vue}"] },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["*.vue", "**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      "vue/multi-word-component-names": "off"
    }
  },
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^__",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_"
        }
      ]
    }
  }
]

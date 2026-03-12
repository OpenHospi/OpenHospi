import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { flatConfigs as importXConfigs } from "eslint-plugin-import-x";
import security from "eslint-plugin-security";
import tseslint from "typescript-eslint";

const config = defineConfig([
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  // ── Import ordering & validation ──
  importXConfigs.recommended,
  importXConfigs.typescript,
  {
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        }),
      ],
    },
  },
  {
    rules: {
      "import-x/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import-x/no-duplicates": "error",
      "import-x/no-named-as-default-member": "off",
    },
  },

  // ── Security ──
  security.configs.recommended,
  {
    rules: {
      "security/detect-object-injection": "off",
    },
  },

  // ── Prettier (must be LAST) ──
  prettier,
]);

export default config;

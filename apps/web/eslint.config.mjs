import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { flatConfigs as importXConfigs } from "eslint-plugin-import-x";
import noSecrets from "eslint-plugin-no-secrets";
import security from "eslint-plugin-security";
import { configs as sonarjsConfigs } from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";

const eslintConfig = defineConfig([
  // ── Next.js core ──
  ...nextVitals,
  ...nextTs,

  // ── Accessibility (strict) ──
  // Upgrades jsx-a11y rules from Next.js default "recommended" to "strict"
  // (errors instead of warnings, fewer exceptions for roles/interactions)
  // Applied as rules-only to avoid re-registering the jsx-a11y plugin already loaded by Next.js
  {
    rules: {
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-activedescendant-has-tabindex": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/autocomplete-valid": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/iframe-has-title": "error",
      "jsx-a11y/img-redundant-alt": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/media-has-caption": "error",
      "jsx-a11y/mouse-events-have-key-events": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/no-distracting-elements": "error",
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
      "jsx-a11y/no-noninteractive-tabindex": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/scope": "error",
      "jsx-a11y/tabindex-no-positive": "error",
    },
  },

  // ── Import ordering & validation ──
  importXConfigs.recommended,
  importXConfigs.typescript,
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
    },
  },

  // ── Security ──
  security.configs.recommended,
  {
    rules: {
      "security/detect-object-injection": "off", // too many false positives
    },
  },

  // ── Secret detection ──
  {
    plugins: { "no-secrets": noSecrets },
    rules: { "no-secrets/no-secrets": "error" },
  },

  // ── Code quality (SonarJS) ──
  sonarjsConfigs.recommended,

  // ── Unicorn best practices (cherry-picked) ──
  {
    plugins: { unicorn },
    rules: {
      "unicorn/prefer-node-protocol": "error",
      "unicorn/no-array-for-each": "warn",
      "unicorn/prefer-string-replace-all": "warn",
      "unicorn/no-lonely-if": "error",
      "unicorn/no-useless-spread": "error",
      "unicorn/prefer-array-find": "warn",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-number-properties": "error",
      "unicorn/throw-new-error": "error",
    },
  },

  // ── Prettier (must be LAST — disables conflicting format rules) ──
  prettier,

  // ── Global ignores ──
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/components/ui/**"]),
]);

export default eslintConfig;

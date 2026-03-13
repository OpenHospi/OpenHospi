import config from "@openhospi/eslint-config";

export default [
  ...config,
  {
    rules: {
      // @noble/curves uses package.json exports map which the ESLint import
      // resolver can't resolve for subpath exports like '@noble/curves/ed25519'.
      // TypeScript resolves these correctly.
      "import-x/no-unresolved": ["error", { ignore: ["@noble/curves/"] }],
    },
  },
];

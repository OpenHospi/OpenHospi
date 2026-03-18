import base from "@openhospi/eslint-config";
import react from "@openhospi/eslint-config/react";

export default [
  ...base,
  ...react,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", ".source/**"],
  },
];

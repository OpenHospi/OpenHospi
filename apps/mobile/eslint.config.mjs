import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', '.expo/*', 'src/components/ui/*'],
  },
  {
    files: ['src/i18n/index.ts'],
    rules: {
      'import/no-named-as-default-member': 'off',
    },
  },
]);

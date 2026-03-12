// @ts-check
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    // Global ignores
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    // TypeScript source files
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // ── Prettier integration ──────────────────────────────────────────────
      'prettier/prettier': 'error',

      // ── TypeScript strict rules ───────────────────────────────────────────
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',

      // ── Function length & complexity ─────────────────────────────────────
      'max-lines-per-function': [
        'error',
        { max: 15, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['error', { max: 10 }],

      // ── General best practices ────────────────────────────────────────────
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',

      // ── Console usage ─────────────────────────────────────────────────────
      // This MCP project uses console.error exclusively for stderr logging
      // (MCP protocol requires stdout to be clean JSON-RPC).
      // Allow console.error; ban everything else.
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  // Spread prettier's config-override last so it disables any
  // ESLint formatting rules that conflict with Prettier.
  prettierConfig,
];

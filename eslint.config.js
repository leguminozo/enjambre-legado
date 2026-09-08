import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
globalIgnores([
    "**/dist/**",
    "**/.next/**",
    "**/node_modules/**",
    "**/.turbo/**",
    "**/coverage/**",
  ]),

  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // React Compiler experimental rules (Next.js 16 doesn't use React Compiler)
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/error-boundaries": "warn",
    },
  },

  {
    files: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/__tests__/**/*.{ts,tsx}",
      "scripts/**/*.{ts,js,mjs}",
      "**/scripts/**/*.{ts,js,mjs}",
    ],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  {
    files: ["apps/**/*.{ts,tsx}"],
    extends: [reactRefresh.configs.recommended],
    rules: {
      "react-refresh/only-export-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  {
    files: ["packages/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  {
    files: [
      "apps/tienda/app/**/*.{ts,tsx}",
      "apps/nucleo/app/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              importNames: ["Sparkles"],
              message:
                "Sparkles es slop de marketing (docs/ANTI_SLOP.md). Usa un icono de oficio o ninguno.",
            },
          ],
        },
      ],
    },
  },
]);

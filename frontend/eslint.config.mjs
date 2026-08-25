import js from "@eslint/js";
import react from "eslint-plugin-react";
import globals from "globals";

export default [
  {
    ignores: ["build/**", "dist/**", "node_modules/**", ".playwright-cli/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      "no-unused-vars": "off",
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    files: ["src/tests/**/*.{js,jsx}", "src/**/*.test.{js,jsx}"],
    languageOptions: {
      globals: globals.jest,
    },
  },
];

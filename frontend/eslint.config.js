import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";

export default [
  { ignores: [".next/**", "node_modules/**", "coverage/**", "dist/**"] },
  ...next(),
  js.configs.recommended,
  ...tseslint.configs.recommended
];
import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  // Express handlers and stubs often declare (req, res, next) without using all of them.
  {rules: {"no-unused-vars": ["error", {args: "none"}]}},
];
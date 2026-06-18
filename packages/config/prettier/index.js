/**
 * Shared Prettier configuration for the entire monorepo.
 *
 * @type {import("prettier").Config}
 */
export default {
  // Core formatting
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,

  // Quote handling
  quoteProps: 'as-needed',
  jsxSingleQuote: false,

  // Brackets and arrows
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Line endings
  endOfLine: 'lf',
};
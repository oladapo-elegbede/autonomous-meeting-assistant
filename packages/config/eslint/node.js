import baseConfig from './base.js';
import globals from 'globals';

/**
 * ESLint configuration for Node.js applications.
 *
 * Extends the base config and adds Node-specific globals
 * and rules. Used by the API server.
 */
export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Node-specific best practices
      'no-process-exit': 'error',
    },
  },
];

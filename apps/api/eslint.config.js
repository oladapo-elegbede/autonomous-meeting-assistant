import nodeConfig from '@meeting-assistant/config/eslint/node';

export default [
  ...nodeConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'tests/**'],
  },
];
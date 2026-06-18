import nextConfig from '@meeting-assistant/config/eslint/next';

export default [
  ...nextConfig,
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'],
  },
];
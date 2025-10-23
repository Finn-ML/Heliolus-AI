import js from '@eslint/js';
import tsEslint from 'typescript-eslint';

export default [
  { ignores: ['dist', 'node_modules', 'src/generated/**/*'] },
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
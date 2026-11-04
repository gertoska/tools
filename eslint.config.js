import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'playwright-report', 'test-results', '.lighthouseci'],
  },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
    rules: {
      // The security promises of this project, enforced by the linter.
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='innerHTML']",
          message: 'Write text with textContent: innerHTML is how XSS gets in.',
        },
        {
          selector: "MemberExpression[property.name='outerHTML']",
          message: 'Write text with textContent: outerHTML is how XSS gets in.',
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'Build nodes with createElement and textContent instead.',
        },
        {
          selector: "CallExpression[callee.name='eval']",
          message: 'The Content-Security-Policy forbids eval, and so does this project.',
        },
        {
          selector: "MemberExpression[object.name='document'][property.name='cookie']",
          message: 'This site sets no cookies.',
        },
        {
          selector: "NewExpression[callee.name='FileReader']",
          message: 'There is no file input anywhere: reading files is out of scope by design.',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['tests/**/*.ts', '*.config.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-unsafe-assignment': 'off' },
  },
);

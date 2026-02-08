module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        ecmaFeatures: {
            jsx: true,
        },
    },
    settings: {
        react: {
            pragma: 'React',
            version: 'detect',
        },
    },
    parser: '@typescript-eslint/parser',
    extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended', 'plugin:import/warnings'],
    plugins: ['@typescript-eslint', 'simple-import-sort'],
    root: true,
    rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': [1, { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/no-empty-function': 'off',
        'prettier/prettier': ['warn'],
        'simple-import-sort/imports': 'off',
        'simple-import-sort/exports': 'warn',
        'import/no-duplicates': 'warn',
        'import/newline-after-import': 'warn',
    },
};

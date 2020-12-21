module.exports = {
    env: {
        commonjs: true,
        es2020: true,
        node: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 11
    },
    rules: {
        indent: [
            'error',
            4
        ],
        quotes: [
            'error',
            'single'
        ],
        semi: [
            'error',
            'always'
        ],
        'eol-last': [
            'error',
            'always'
        ],
        'prefer-const': [
            'warn'
        ],
        'quote-props': ['error', 'as-needed'],
        'no-async-promise-executor': 0,
        'no-unused-vars': 0
    }
};

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': [
      'warn',
      {
        printWidth: 120,
        semi: true,
        useTabs: true,
        tabWidth: 1,
        singleQuote: true,
        bracketSpacing: true,
        arrowParens: 'always',
      },
    ],
    semi: ['warn', 'always'],
    'no-console': 'off',
    yoda: 'warn',
    'no-unused-vars': 'warn',
    'no-trailing-spaces': 'warn',
    'no-undef': 'warn',
    'no-irregular-whitespace': 'warn',
    indent: [
      'warn',
      'tab',
      {
        SwitchCase: 1, //1 tab for each Switch statement
        VariableDeclarator: 1, //Use more variables with 1 tab
        MemberExpression: 1, //Use 1 tab when variable with moore expressions
        outerIIFEBody: 1,
        FunctionDeclaration: {
          parameters: 2,
          body: 1,
        },
        CallExpression: {
          arguments: 1,
        },
        ArrayExpression: 1, //Use 1 tab for array notation
        ObjectExpression: 1, //Use 1 tab for object notation
      },
    ],
    'newline-per-chained-call': [
      'warn',
      {
        ignoreChainWithDepth: 2,
      },
    ],
    'no-mixed-spaces-and-tabs': 'warn',
  },
};

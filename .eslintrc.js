module.exports = {
  root: true,
  plugins: ["cypress", "jest"],
  env: {
    es6: true,
    "cypress/globals": true,
    node: true,
    jest: true,
  },
  extends: [
    "plugin:cypress/recommended",
    "plugin:chai-friendly/recommended",
    "eslint:recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2022,
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "cypress/no-unnecessary-waiting": "warn",
  },
};

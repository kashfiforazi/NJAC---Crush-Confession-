export default [
  {
    ignores: ['dist/**/*']
  },
  {
    plugins: {
      firebase: require('@firebase/eslint-plugin-security-rules')
    },
    rules: {
      // add relevant rules if needed
    }
  }
];

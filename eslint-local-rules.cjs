/**
 * ESLint Local Rules Plugin Configuration
 * This file registers our custom rules as a plugin
 */

module.exports = {
  "no-snakecase-props": require("./eslint-rules/no-snakecase-props.cjs"),
};

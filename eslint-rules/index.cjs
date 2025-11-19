/**
 * Custom ESLint Rules for Steel App Frontend
 * 
 * These rules enforce project-specific code quality standards.
 */

module.exports = {
  rules: {
    'no-snakecase-props': require('./no-snakecase-props'),
  },
};

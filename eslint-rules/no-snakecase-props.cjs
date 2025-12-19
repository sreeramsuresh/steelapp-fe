/**
 * ESLint Rule: no-snakecase-props
 *
 * Detects and prevents snake_case property access in frontend code.
 * This rule catches bugs like: invoice.invoice_number, invoice.customer_details, etc.
 *
 * CRITICAL: This prevents the exact bug that caused InvoiceList to show empty cells.
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow snake_case property access (frontend should use camelCase after normalization)",
      category: "Best Practices",
      recommended: true,
    },
    fixable: null, // Not auto-fixable (requires human judgment)
    schema: [],
    messages: {
      snakeCaseProperty:
        "Snake_case property '{{name}}' detected. Frontend should use camelCase after normalization. Did you mean '{{suggestion}}'?",
    },
  },

  create(context) {
    /**
     * Convert snake_case to camelCase for suggestions
     */
    function snakeToCamel(str) {
      return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    /**
     * Check if a property name is snake_case
     */
    function isSnakeCase(name) {
      // Must contain underscore
      if (!name.includes("_")) return false;

      // Ignore special cases
      if (name.startsWith("__")) return false; // __proto__, __dirname, etc.
      if (name === "_") return false; // Lodash placeholder
      if (name.startsWith("UNSAFE_")) return false; // React lifecycle methods

      // Check if it matches snake_case pattern: lowercase_with_underscores
      return /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(name);
    }

    /**
     * Report snake_case property access
     */
    function reportSnakeCaseAccess(node, propertyName) {
      context.report({
        node,
        messageId: "snakeCaseProperty",
        data: {
          name: propertyName,
          suggestion: snakeToCamel(propertyName),
        },
      });
    }

    return {
      /**
       * Check MemberExpression: obj.property_name
       */
      MemberExpression(node) {
        // Skip computed properties: obj[variable] or obj['literal']
        if (node.computed) return;

        // Get property name
        const propertyName = node.property.name;
        if (!propertyName) return;

        // Check if it's snake_case
        if (isSnakeCase(propertyName)) {
          reportSnakeCaseAccess(node.property, propertyName);
        }
      },

      /**
       * Check OptionalMemberExpression: obj?.property_name
       */
      "MemberExpression[optional=true]"(node) {
        // Skip computed properties
        if (node.computed) return;

        // Get property name
        const propertyName = node.property.name;
        if (!propertyName) return;

        // Check if it's snake_case
        if (isSnakeCase(propertyName)) {
          reportSnakeCaseAccess(node.property, propertyName);
        }
      },

      /**
       * Check destructuring: const { property_name } = obj
       */
      Property(node) {
        // Only check object destructuring, not object literals
        if (node.parent.type !== "ObjectPattern") return;

        // Skip if property is not an identifier
        if (node.key.type !== "Identifier") return;

        // Get property name
        const propertyName = node.key.name;

        // Check if it's snake_case
        if (isSnakeCase(propertyName)) {
          reportSnakeCaseAccess(node.key, propertyName);
        }
      },
    };
  },
};

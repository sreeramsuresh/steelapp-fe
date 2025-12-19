/**
 * ESLint Rule: no-dead-button
 *
 * Detects buttons without interaction handlers (dead buttons)
 * Ensures every button has either:
 * - onClick prop with non-empty handler
 * - type="submit" inside a <form> element
 * - disabled attribute (intentionally non-interactive)
 * - spread props (can't statically analyze)
 * - asChild prop (delegates interaction to child)
 *
 * Flags:
 * - Buttons without any handler
 * - Empty/stub onClick handlers: () => {}, () => undefined
 * - type="submit" outside of <form>
 * - type="button" with empty onClick handler
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow buttons without interaction handlers (dead buttons)',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noHandler:
        'Button has no interaction handler. Add onClick={handler}, or use type="submit" inside a <form>.',
      emptyHandler:
        'Button has an empty onClick handler (() => {}). Either implement the handler or remove the button.',
      submitOutsideForm:
        'Button with type="submit" is not inside a <form> element. Use type="button" with onClick instead.',
      useSubmitType:
        'Button with onSubmit handler should use type="submit" inside a <form> instead of onClick.',
    },
  },

  create(context) {
    // Track custom button component imports
    const buttonImports = new Set(['Button', 'LoadingButton']);

    // Helper: Get element name from JSX node
    function getElementName(node) {
      if (node.name.type === 'JSXIdentifier') {
        return node.name.name;
      }
      return null;
    }

    // Helper: Check if element is a button
    function isButton(elementName) {
      if (elementName === 'button') return true;
      if (buttonImports.has(elementName)) return true;
      return false;
    }

    // Helper: Check if attributes contain a prop
    function hasAttribute(attributes, propName) {
      return attributes.some((attr) => attr.type === 'JSXAttribute' && attr.name.name === propName);
    }

    // Helper: Get attribute value (literal only)
    function getAttributeValue(attributes, propName) {
      const attr = attributes.find((attr) => attr.type === 'JSXAttribute' && attr.name.name === propName);

      if (!attr || !attr.value) return undefined;

      if (attr.value.type === 'Literal') {
        return attr.value.value;
      }

      if (attr.value.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression;
        if (expr.type === 'Literal') {
          return expr.value;
        }
        // For true boolean: <Button asChild />
        if (expr.type === 'JSXEmptyExpression') {
          return true;
        }
      }

      return undefined;
    }

    // Helper: Check for spread attributes
    function hasSpreadAttributes(attributes) {
      return attributes.some((attr) => attr.type === 'JSXSpreadAttribute');
    }

    // Helper: Check if onClick handler is empty/stub
    function isEmptyHandler(attributes, propName) {
      const attr = attributes.find((attr) => attr.type === 'JSXAttribute' && attr.name.name === propName);

      if (!attr || !attr.value) return false;

      if (attr.value.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression;

        // Arrow function: () => {}
        if (expr.type === 'ArrowFunctionExpression') {
          const body = expr.body;

          // Empty block: () => {}
          if (body.type === 'BlockStatement' && body.body.length === 0) {
            return true;
          }

          // Single undefined/null return: () => undefined
          if (body.type === 'Identifier' && (body.name === 'undefined' || body.name === 'null')) {
            return true;
          }

          // Expression returning undefined: () => void 0
          if (
            body.type === 'UnaryExpression' &&
            body.operator === 'void' &&
            body.argument.type === 'Literal' &&
            body.argument.value === 0
          ) {
            return true;
          }
        }

        // Function expression: function() {}
        if (expr.type === 'FunctionExpression') {
          if (expr.body.body.length === 0) {
            return true;
          }
        }
      }

      return false;
    }

    // Helper: Check if button is inside a form with onSubmit
    function isInsideFormWithSubmit(node) {
      let current = node.parent;

      while (current) {
        if (current.type === 'JSXElement') {
          const openingElement = current.openingElement;
          if (
            openingElement &&
            openingElement.name.type === 'JSXIdentifier' &&
            openingElement.name.name === 'form'
          ) {
            // Found form - check if it has onSubmit
            return hasAttribute(openingElement.attributes, 'onSubmit');
          }
        }
        current = current.parent;
      }

      return false;
    }

    // Helper: Check if button is inside a form
    function isInsideForm(node) {
      let current = node.parent;

      while (current) {
        if (current.type === 'JSXElement') {
          const openingElement = current.openingElement;
          if (
            openingElement &&
            openingElement.name.type === 'JSXIdentifier' &&
            openingElement.name.name === 'form'
          ) {
            return true;
          }
        }
        current = current.parent;
      }

      return false;
    }

    return {
      // Track button imports
      ImportDeclaration(node) {
        // Check for Button from ui/button
        if (node.source.value.includes('ui/button') || node.source.value.includes('@/components/ui/button')) {
          node.specifiers.forEach((spec) => {
            if (spec.type === 'ImportSpecifier' && spec.imported.name === 'Button') {
              buttonImports.add('Button');
            }
          });
        }

        // Check for LoadingButton
        if (node.source.value.includes('LoadingButton')) {
          node.specifiers.forEach((spec) => {
            if (spec.type === 'ImportDefaultSpecifier' && spec.local.name === 'LoadingButton') {
              buttonImports.add('LoadingButton');
            }
          });
        }
      },

      // Validate JSX button elements
      JSXOpeningElement(node) {
        const elementName = getElementName(node);

        // Skip if not a button
        if (!isButton(elementName)) return;

        const attributes = node.attributes;

        // SKIP: Disabled buttons (intentionally non-interactive)
        if (hasAttribute(attributes, 'disabled')) return;

        // SKIP: Button with asChild (delegating to child element)
        if (getAttributeValue(attributes, 'asChild') === true) return;

        // SKIP: Spread props (can't statically analyze)
        if (hasSpreadAttributes(attributes)) return;

        // CHECK 1: Empty onClick handler
        if (hasAttribute(attributes, 'onClick')) {
          if (isEmptyHandler(attributes, 'onClick')) {
            context.report({
              node,
              messageId: 'emptyHandler',
            });
          }
          return; // Has onClick, we're done
        }

        // CHECK 2: type="submit"
        const typeAttr = getAttributeValue(attributes, 'type');

        if (typeAttr === 'submit') {
          if (!isInsideForm(node)) {
            context.report({
              node,
              messageId: 'submitOutsideForm',
            });
          }
          return; // type="submit" is valid inside form
        }

        // CHECK 3: onSubmit on button (anti-pattern)
        if (hasAttribute(attributes, 'onSubmit')) {
          context.report({
            node,
            messageId: 'useSubmitType',
          });
          return;
        }

        // CHECK 4: No handler at all
        // Special case: type="button" or no type (defaults to "submit") inside form with onSubmit is OK
        if (isInsideFormWithSubmit(node)) {
          return; // Form will submit when button clicked
        }

        // Button has no handler and not in a form - this is a dead button
        context.report({
          node,
          messageId: 'noHandler',
        });
      },
    };
  },
};

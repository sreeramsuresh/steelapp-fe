/**
 * HTML Escape Utilities
 *
 * Prevents XSS (Cross-Site Scripting) attacks by escaping HTML special characters
 * in user-provided input before rendering in PDF templates or HTML contexts.
 *
 * SECURITY: Always use these functions when embedding user input in HTML strings.
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string|null|undefined} value - The string to escape
 * @returns {string} - HTML-safe string
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export const escapeHtml = (value) => {
  if (value == null || value === '') return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Escapes HTML and converts newlines to <br> tags
 * Useful for displaying multi-line user input (like notes or terms)
 *
 * @param {string|null|undefined} value - The string to escape and format
 * @returns {string} - HTML-safe string with line breaks
 *
 * @example
 * escapeHtmlWithLineBreaks('Line 1\nLine 2')
 * // Returns: 'Line 1<br>Line 2'
 *
 * escapeHtmlWithLineBreaks('<script>alert("XSS")</script>\nHarmless text')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;<br>Harmless text'
 */
export const escapeHtmlWithLineBreaks = (value) => {
  if (value == null || value === '') return '';

  return escapeHtml(value).replace(/\n/g, '<br>');
};

/**
 * Test function to verify HTML escape is working correctly
 * Run this in development to validate the escaping
 *
 * @returns {boolean} - true if all tests pass
 */
export const testHtmlEscape = () => {
  const tests = [
    {
      input: '<script>alert("XSS")</script>',
      expected: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      name: 'Script tag escape'
    },
    {
      input: '<img src=x onerror="alert(\'XSS\')">',
      expected: '&lt;img src=x onerror=&quot;alert(&#039;XSS&#039;)&quot;&gt;',
      name: 'Image tag with event handler'
    },
    {
      input: '"><script>alert(String.fromCharCode(88,83,83))</script>',
      expected: '&quot;&gt;&lt;script&gt;alert(String.fromCharCode(88,83,83))&lt;&#x2F;script&gt;',
      name: 'Quote escape with script'
    },
    {
      input: null,
      expected: '',
      name: 'Null value'
    },
    {
      input: '',
      expected: '',
      name: 'Empty string'
    }
  ];

  const results = tests.map(test => {
    const result = escapeHtml(test.input);
    const pass = result === test.expected;
    return { ...test, result, pass };
  });

  const allPass = results.every(r => r.pass);

  if (!allPass) {
    console.error('HTML Escape Tests Failed:', results.filter(r => !r.pass));
  }

  return allPass;
};

/**
 * PDF Generators - Structural Sanity Tests (Node.js Unit Level)
 *
 * Only configurablePdfGenerator remains on the frontend (used for invoice template preview).
 * All other generators have been migrated to backend SSR pipeline (PDF Hardening Phases 0-5).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('PDF Generators - Structural Sanity (Node.js)', () => {
  describe('configurablePdfGenerator', () => {
    test('should be importable and export generateConfigurablePDF function', async () => {
      const module = await import('../configurablePdfGenerator.js');
      assert.ok(module.generateConfigurablePDF !== undefined);
      assert.strictEqual(typeof module.generateConfigurablePDF, 'function');
    });
  });

  // Deleted generators (migrated to backend SSR pipeline):
  // - pdfGenerator.js (DEPRECATED)
  // - poPdfGenerator.js
  // - quotationPdfGenerator.js
  // - deliveryNotePdfGenerator.js
  // - paymentReceiptGenerator.js + receiptTemplateGenerator.js
  // - statementPdfGenerator.js
});

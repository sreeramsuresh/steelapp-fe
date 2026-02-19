/**
 * Customer Credit Service Unit Tests (Node Native Test Runner)
 * Tests credit risk assessment and monitoring
 * Tests credit limit management and DSO calculations
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import api from '../api.js';
import { customerCreditService } from '../customerCreditService.js';

describe('customerCreditService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getHighRiskCustomers', () => {
    test('should fetch high-risk customers', async () => {
      const mockHighRisk = [
        { id: 101, name: 'Risky Corp', creditGrade: 'D', dso: 85 },
        { id: 102, name: 'Danger Ltd', creditGrade: 'E', dso: 120 },
      ];
      sinon.stub(api, 'get').resolves({ data: mockHighRisk });

      const result = await customerCreditService.getHighRiskCustomers(50);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].creditGrade, 'D');
      assert.ok(api.get.calledWith('/customers/credit-risk/high', {
        params: { limit: 50 },
      }));
    });

    test('should use default limit of 50', async () => {
      sinon.stub(api, 'get').resolves({ data: [] });

      await customerCreditService.getHighRiskCustomers();

      assert.ok(api.get.calledWith('/customers/credit-risk/high', {
        params: { limit: 50 },
      }));
    });
  });

  describe('getOverLimitCustomers', () => {
    test('should identify customers over credit limit', async () => {
      const mockOverLimit = [
        {
          id: 101,
          name: 'Over Limit Inc',
          creditLimit: 100000,
          totalOutstanding: 125000,
        },
      ];
      sinon.stub(api, 'get').resolves({ data: mockOverLimit });

      const result = await customerCreditService.getOverLimitCustomers();

      assert.strictEqual(result.length, 1);
      assert.ok(result[0].totalOutstanding > result[0].creditLimit);
      assert.ok(api.get.calledWith('/customers/credit-risk/over-limit'));
    });
  });

  describe('getCustomerCreditSummary', () => {
    test('should fetch detailed credit summary', async () => {
      const mockSummary = {
        customerId: 101,
        customerName: 'Premium Corp',
        creditLimit: 500000,
        creditUtilization: 350000,
        utilizationPercent: 70,
        creditGrade: 'A',
        dso: 35,
      };
      sinon.stub(api, 'get').resolves({ data: mockSummary });

      const result = await customerCreditService.getCustomerCreditSummary(101);

      assert.strictEqual(result.creditGrade, 'A');
      assert.strictEqual(result.utilizationPercent, 70);
      assert.ok(api.get.calledWith('/customers/101/credit-summary'));
    });

    test('should handle customer not found', async () => {
      sinon.stub(api, 'get').rejects(new Error('Customer not found'));

      try {
        await customerCreditService.getCustomerCreditSummary(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Customer not found');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      sinon.stub(api, 'get').rejects(new Error('Network error'));

      try {
        await customerCreditService.getHighRiskCustomers();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle API errors for over-limit customers', async () => {
      sinon.stub(api, 'get').rejects(new Error('API Error'));

      try {
        await customerCreditService.getOverLimitCustomers();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'API Error');
      }
    });
  });
});

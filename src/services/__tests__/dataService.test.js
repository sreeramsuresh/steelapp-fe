import { describe, it, expect } from 'vitest';

describe('dataService', () => {
  it('should re-export invoiceService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.invoiceService).toBeDefined();
  });

  it('should re-export customerService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.customerService).toBeDefined();
  });

  it('should re-export productService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.productService).toBeDefined();
  });

  it('should re-export companyService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.companyService).toBeDefined();
  });

  it('should re-export quotationService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.quotationService).toBeDefined();
  });

  it('should re-export deliveryNoteService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.deliveryNoteService).toBeDefined();
  });

  it('should re-export purchaseOrderService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.purchaseOrderService).toBeDefined();
  });

  it('should re-export accountStatementService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.accountStatementService).toBeDefined();
  });

  it('should re-export transitService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.transitService).toBeDefined();
  });

  it('should re-export payablesService', async () => {
    const mod = await import('../dataService.js');
    expect(mod.payablesService).toBeDefined();
  });

  it('should re-export PAYMENT_MODES', async () => {
    const mod = await import('../dataService.js');
    expect(mod.PAYMENT_MODES).toBeDefined();
  });

  it('should have a default export with all services', async () => {
    const mod = await import('../dataService.js');
    expect(mod.default).toBeDefined();
    expect(mod.default.invoiceService).toBeDefined();
    expect(mod.default.customerService).toBeDefined();
    expect(mod.default.productService).toBeDefined();
  });
});

import { describe, it, expect } from 'vitest';

import {
  LazyRevenueKPIWidget,
  LazyARAgingWidget,
  LazyInventoryHealthWidget,
  LazyTopProductsWidget,
  LazyCustomerCLVWidget,
  LazyAgentScorecardWidget,
  LazyVATCollectionWidget,
  LAZY_WIDGET_CATEGORIES,
} from '../LazyWidgets';

describe('LazyWidgets', () => {
  it('exports lazy financial widgets', () => {
    expect(LazyRevenueKPIWidget).toBeDefined();
    expect(LazyARAgingWidget).toBeDefined();
  });

  it('exports lazy inventory widgets', () => {
    expect(LazyInventoryHealthWidget).toBeDefined();
  });

  it('exports lazy product widgets', () => {
    expect(LazyTopProductsWidget).toBeDefined();
  });

  it('exports lazy customer widgets', () => {
    expect(LazyCustomerCLVWidget).toBeDefined();
  });

  it('exports lazy sales agent widgets', () => {
    expect(LazyAgentScorecardWidget).toBeDefined();
  });

  it('exports lazy VAT widgets', () => {
    expect(LazyVATCollectionWidget).toBeDefined();
  });

  it('exports LAZY_WIDGET_CATEGORIES with all categories', () => {
    expect(LAZY_WIDGET_CATEGORIES).toBeDefined();
    expect(LAZY_WIDGET_CATEGORIES.financial).toBeDefined();
    expect(LAZY_WIDGET_CATEGORIES.inventory).toBeDefined();
    expect(LAZY_WIDGET_CATEGORIES.product).toBeDefined();
    expect(LAZY_WIDGET_CATEGORIES.customer).toBeDefined();
    expect(LAZY_WIDGET_CATEGORIES.sales).toBeDefined();
    expect(LAZY_WIDGET_CATEGORIES.vat).toBeDefined();
  });

  it('has correct number of widgets per category', () => {
    expect(LAZY_WIDGET_CATEGORIES.financial).toHaveLength(11);
    expect(LAZY_WIDGET_CATEGORIES.inventory).toHaveLength(6);
    expect(LAZY_WIDGET_CATEGORIES.product).toHaveLength(5);
    expect(LAZY_WIDGET_CATEGORIES.customer).toHaveLength(4);
    expect(LAZY_WIDGET_CATEGORIES.sales).toHaveLength(7);
    expect(LAZY_WIDGET_CATEGORIES.vat).toHaveLength(8);
  });
});

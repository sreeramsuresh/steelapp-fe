/**
 * Pinned Products E2E Tests
 *
 * Tests for quick access to favorite products
 * - List pinned products
 * - Pin/unpin products
 * - Pagination
 * - Search pinned products
 */

describe('Pinned Products', () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.navigateTo('/dashboard');
  });

  describe('Pinned Products Widget', () => {
    it('should display pinned products widget on dashboard', () => {
      cy.get('[data-testid="pinned-products-widget"]').should('be.visible');
      cy.contains('Favorite Products').should('be.visible');
    });

    it('should show empty state when no products pinned', () => {
      cy.get('[data-testid="pinned-products-widget"]').within(() => {
        cy.contains('No favorite products yet').should('be.visible');
        cy.contains('Pin products for quick access').should('be.visible');
      });
    });

    it('should limit display to 5 most recent pinned products', () => {
      cy.get('[data-testid="pinned-product-item"]').should('have.length.at.most', 5);
    });
  });

  describe('Pin Products', () => {
    it('should pin product from products page', () => {
      cy.navigateTo('/products');
      cy.get('[data-testid="product-row"]').first().within(() => {
        cy.get('[data-testid="btn-pin-product"]').click();
      });

      cy.contains('Product pinned').should('be.visible');
    });

    it('should add pinned product to widget', () => {
      cy.navigateTo('/products');
      const productName = 'SS304-SHEET-2mm';

      cy.get('[data-testid="product-row"]').contains(productName).closest('[data-testid="product-row"]').within(() => {
        cy.get('[data-testid="btn-pin-product"]').click();
      });

      cy.navigateTo('/dashboard');
      cy.get('[data-testid="pinned-products-widget"]').within(() => {
        cy.contains(productName).should('be.visible');
      });
    });

    it('should pin multiple products', () => {
      cy.navigateTo('/products');

      cy.get('[data-testid="product-row"]').eq(0).within(() => {
        cy.get('[data-testid="btn-pin-product"]').click();
      });

      cy.get('[data-testid="product-row"]').eq(1).within(() => {
        cy.get('[data-testid="btn-pin-product"]').click();
      });

      cy.get('[data-testid="product-row"]').eq(2).within(() => {
        cy.get('[data-testid="btn-pin-product"]').click();
      });

      cy.navigateTo('/dashboard');
      cy.get('[data-testid="pinned-product-item"]').should('have.length', 3);
    });
  });

  describe('Unpin Products', () => {
    beforeEach(() => {
      // Pin 2 products
      cy.request('POST', '/api/pinned-products', { product_id: 1 });
      cy.request('POST', '/api/pinned-products', { product_id: 2 });
      cy.reload();
    });

    it('should unpin product from widget', () => {
      cy.get('[data-testid="pinned-products-widget"]').within(() => {
        cy.get('[data-testid="pinned-product-item"]').first().within(() => {
          cy.get('[data-testid="btn-unpin"]').click();
        });
      });

      cy.contains('Product unpinned').should('be.visible');
    });

    it('should remove unpinned product from widget', () => {
      const initialCount = cy.get('[data-testid="pinned-product-item"]').length;

      cy.get('[data-testid="pinned-products-widget"]').within(() => {
        cy.get('[data-testid="pinned-product-item"]').first().within(() => {
          cy.get('[data-testid="btn-unpin"]').click();
        });
      });

      cy.get('[data-testid="pinned-product-item"]').should('have.length', initialCount - 1);
    });

    it('should unpin product from products page', () => {
      cy.navigateTo('/products');
      cy.get('[data-testid="product-row"]').first().within(() => {
        cy.get('[data-testid="btn-unpin-product"]').should('be.visible');
        cy.get('[data-testid="btn-unpin-product"]').click();
      });

      cy.contains('Product unpinned').should('be.visible');
    });

    it('should show empty state after unpinning all products', () => {
      cy.get('[data-testid="pinned-products-widget"]').within(() => {
        cy.get('[data-testid="pinned-product-item"]').each(() => {
          cy.get('[data-testid="btn-unpin"]').first().click();
        });

        cy.contains('No favorite products yet').should('be.visible');
      });
    });
  });

  describe('Pinned Products Page', () => {
    beforeEach(() => {
      // Pin 10 products
      for (let i = 1; i <= 10; i++) {
        cy.request('POST', '/api/pinned-products', { product_id: i });
      }
      cy.navigateTo('/pinned-products');
    });

    it('should display dedicated pinned products page', () => {
      cy.contains('h1', 'Favorite Products').should('be.visible');
    });

    it('should list all pinned products with pagination', () => {
      cy.get('[data-testid="product-list"]').within(() => {
        cy.get('[data-testid="product-item"]').should('have.length.at.least', 5);
      });
    });

    it('should paginate pinned products list', () => {
      cy.get('[data-testid="pagination"]').within(() => {
        cy.get('[data-testid="page-2"]').should('be.visible');
        cy.get('[data-testid="page-2"]').click();
      });

      cy.get('[data-testid="product-list"]').should('be.visible');
    });

    it('should show product details in list', () => {
      cy.get('[data-testid="product-item"]').first().within(() => {
        cy.get('[data-testid="product-name"]').should('be.visible');
        cy.get('[data-testid="product-grade"]').should('be.visible');
        cy.get('[data-testid="product-form"]').should('be.visible');
      });
    });

    it('should allow unpinning from dedicated page', () => {
      const initialCount = cy.get('[data-testid="product-item"]').length;

      cy.get('[data-testid="product-item"]').first().within(() => {
        cy.get('[data-testid="btn-unpin"]').click();
      });

      cy.get('[data-testid="product-item"]').should('have.length', initialCount - 1);
    });

    it('should allow bulk unpin action', () => {
      cy.get('[data-testid="checkbox-select-all"]').click();
      cy.get('[data-testid="btn-unpin-selected"]').click();

      cy.get('[data-testid="modal-confirm"]').within(() => {
        cy.get('[data-testid="btn-confirm"]').click();
      });

      cy.contains('Products unpinned').should('be.visible');
      cy.contains('No favorite products').should('be.visible');
    });
  });

  describe('Search & Filter', () => {
    beforeEach(() => {
      // Pin 5 products
      cy.request('POST', '/api/pinned-products', { product_id: 1 });
      cy.request('POST', '/api/pinned-products', { product_id: 2 });
      cy.request('POST', '/api/pinned-products', { product_id: 3 });
      cy.navigateTo('/pinned-products');
    });

    it('should search pinned products by name', () => {
      cy.get('[data-testid="search-products"]').type('SS304');
      cy.get('[data-testid="product-item"]').should('have.length.greaterThan', 0);
    });

    it('should filter by grade', () => {
      cy.get('[data-testid="filter-grade"]').click();
      cy.get('[data-testid="option-304"]').click();

      cy.get('[data-testid="product-item"]').each(() => {
        cy.get('[data-testid="product-grade"]').should('contain', '304');
      });
    });

    it('should filter by form', () => {
      cy.get('[data-testid="filter-form"]').click();
      cy.get('[data-testid="option-SHEET"]').click();

      cy.get('[data-testid="product-item"]').each(() => {
        cy.get('[data-testid="product-form"]').should('contain', 'SHEET');
      });
    });

    it('should clear all filters', () => {
      cy.get('[data-testid="filter-grade"]').click();
      cy.get('[data-testid="option-304"]').click();

      cy.get('[data-testid="btn-clear-filters"]').click();
      cy.get('[data-testid="product-item"]').should('have.length', 3);
    });
  });

  describe('Quick Actions from Pinned Widget', () => {
    beforeEach(() => {
      cy.request('POST', '/api/pinned-products', { product_id: 1 });
      cy.navigateTo('/dashboard');
    });

    it('should navigate to product details', () => {
      cy.get('[data-testid="pinned-products-widget"]').within(() => {
        cy.get('[data-testid="pinned-product-item"]').first().click();
      });

      cy.url().should('include', '/products/');
    });

    it('should create invoice with pinned product', () => {
      cy.get('[data-testid="pinned-products-widget"]').within(() => {
        cy.get('[data-testid="pinned-product-item"]').first().within(() => {
          cy.get('[data-testid="btn-add-to-invoice"]').click();
        });
      });

      cy.url().should('include', '/invoices/create');
      cy.get('[data-testid="invoice-line-item"]').within(() => {
        cy.get('[data-testid="product-name"]').should('not.be.empty');
      });
    });

    it('should view stock for pinned product', () => {
      cy.get('[data-testid="pinned-products-widget"]').within(() => {
        cy.get('[data-testid="pinned-product-item"]').first().within(() => {
          cy.get('[data-testid="btn-view-stock"]').click();
        });
      });

      cy.get('[data-testid="modal-stock-details"]').should('be.visible');
      cy.contains('Available Stock').should('be.visible');
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      for (let i = 1; i <= 5; i++) {
        cy.request('POST', '/api/pinned-products', { product_id: i });
      }
      cy.navigateTo('/pinned-products');
    });

    it('should sort by recently pinned', () => {
      cy.get('[data-testid="sort-dropdown"]').click();
      cy.get('[data-testid="sort-recent"]').click();

      cy.get('[data-testid="product-item"]').first().within(() => {
        cy.get('[data-testid="product-name"]').should('contain', '5'); // Most recent
      });
    });

    it('should sort by name ascending', () => {
      cy.get('[data-testid="sort-dropdown"]').click();
      cy.get('[data-testid="sort-name-asc"]').click();

      cy.get('[data-testid="product-item"]').first().within(() => {
        cy.get('[data-testid="product-name"]').should('not.be.empty');
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.request('POST', '/api/pinned-products', { product_id: 1 });
      cy.request('POST', '/api/pinned-products', { product_id: 2 });
    });

    it('should display widget on mobile dashboard', () => {
      cy.viewport('iphone-x');
      cy.navigateTo('/dashboard');
      cy.get('[data-testid="pinned-products-widget"]').should('be.visible');
    });

    it('should display pinned products page on mobile', () => {
      cy.viewport('iphone-x');
      cy.navigateTo('/pinned-products');
      cy.get('[data-testid="product-list"]').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.navigateTo('/pinned-products');
      cy.get('[data-testid="product-item"]').should('have.length', 2);
    });
  });

  describe('Error Handling', () => {
    it('should handle pin errors gracefully', () => {
      cy.intercept('POST', '/api/pinned-products', {
        statusCode: 500,
        body: { error: 'Failed to pin product' },
      }).as('pinError');

      cy.navigateTo('/products');
      cy.get('[data-testid="product-row"]').first().within(() => {
        cy.get('[data-testid="btn-pin-product"]').click();
      });

      cy.contains('Failed to pin product').should('be.visible');
    });

    it('should handle unpin errors gracefully', () => {
      cy.request('POST', '/api/pinned-products', { product_id: 1 });
      cy.intercept('DELETE', '/api/pinned-products/*', {
        statusCode: 500,
      }).as('unpinError');

      cy.navigateTo('/dashboard');
      cy.get('[data-testid="pinned-products-widget"]').within(() => {
        cy.get('[data-testid="btn-unpin"]').first().click();
      });

      cy.contains('Failed to unpin').should('be.visible');
    });
  });
});

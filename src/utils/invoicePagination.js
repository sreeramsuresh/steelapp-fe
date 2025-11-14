/**
 * Invoice Pagination Calculator
 * Calculates how many pages are needed for an invoice based on line items
 * and determines how many items fit on each page
 */

// A4 Page Configuration (in mm)
export const PAGE_CONFIG = {
  // Page dimensions
  A4_HEIGHT: 297,
  A4_WIDTH: 210,

  // Fixed section heights (approximate in mm)
  HEADER_HEIGHT: 45,           // Company logo, name, address
  CUSTOMER_SECTION_HEIGHT: 55, // Invoice to + Invoice info box (first page only)
  FOOTER_HEIGHT: 30,           // Contact info + page numbers
  SIGNATURE_SECTION_HEIGHT: 70, // Seal + authorized signatory (last page only)
  TOTALS_SECTION_HEIGHT: 60,   // Subtotal, VAT, Total, Advance, Balance
  FOOTER_NOTES_HEIGHT: 25,     // Payment terms, notes (last page only)

  // Line item heights
  TABLE_HEADER_HEIGHT: 10,     // Description, Qty, Rate, etc.
  LINE_ITEM_HEIGHT: 8,         // Each product row

  // Margins and spacing
  TOP_MARGIN: 15,
  BOTTOM_MARGIN: 15,
  SPACING_BUFFER: 10,          // Extra buffer for safety
};

/**
 * Calculate available height for line items on first page
 * First page has: Header + Customer Info + Items + Footer
 * NO totals, notes, or signature (those are only on last page)
 */
function getFirstPageItemsHeight() {
  return (
    PAGE_CONFIG.A4_HEIGHT -
    PAGE_CONFIG.TOP_MARGIN -
    PAGE_CONFIG.BOTTOM_MARGIN -
    PAGE_CONFIG.HEADER_HEIGHT -
    PAGE_CONFIG.CUSTOMER_SECTION_HEIGHT -
    PAGE_CONFIG.TABLE_HEADER_HEIGHT -
    PAGE_CONFIG.FOOTER_HEIGHT -
    PAGE_CONFIG.SPACING_BUFFER
  );
}

/**
 * Calculate available height for line items on subsequent pages
 */
function getOtherPageItemsHeight() {
  return (
    PAGE_CONFIG.A4_HEIGHT -
    PAGE_CONFIG.TOP_MARGIN -
    PAGE_CONFIG.BOTTOM_MARGIN -
    PAGE_CONFIG.HEADER_HEIGHT -
    PAGE_CONFIG.TABLE_HEADER_HEIGHT -
    PAGE_CONFIG.FOOTER_HEIGHT -
    PAGE_CONFIG.SPACING_BUFFER
  );
}

/**
 * Calculate available height for line items on last page
 */
function getLastPageItemsHeight() {
  return (
    PAGE_CONFIG.A4_HEIGHT -
    PAGE_CONFIG.TOP_MARGIN -
    PAGE_CONFIG.BOTTOM_MARGIN -
    PAGE_CONFIG.HEADER_HEIGHT -
    PAGE_CONFIG.TABLE_HEADER_HEIGHT -
    PAGE_CONFIG.TOTALS_SECTION_HEIGHT -
    PAGE_CONFIG.FOOTER_NOTES_HEIGHT -
    PAGE_CONFIG.SIGNATURE_SECTION_HEIGHT -
    PAGE_CONFIG.FOOTER_HEIGHT -
    PAGE_CONFIG.SPACING_BUFFER
  );
}

/**
 * Calculate pagination for an invoice
 * @param {Object} invoice - Invoice data with items array
 * @returns {Object} Pagination info with pages count and items per page
 */
export function calculatePagination(invoice) {
  const items = invoice?.items || [];
  const itemCount = items.length;

  // No items case
  if (itemCount === 0) {
    return {
      pages: 1,
      itemsPerPage: [0],
      distribution: {
        firstPage: 0,
        middlePages: [],
        lastPage: 0
      }
    };
  }

  // Calculate how many items fit on each page type
  const firstPageHeight = getFirstPageItemsHeight();
  const otherPageHeight = getOtherPageItemsHeight();
  const lastPageHeight = getLastPageItemsHeight();

  const maxItemsFirstPage = Math.floor(firstPageHeight / PAGE_CONFIG.LINE_ITEM_HEIGHT);
  const maxItemsOtherPage = Math.floor(otherPageHeight / PAGE_CONFIG.LINE_ITEM_HEIGHT);
  const maxItemsLastPage = Math.floor(lastPageHeight / PAGE_CONFIG.LINE_ITEM_HEIGHT);

  // Single page case
  if (itemCount <= maxItemsFirstPage) {
    return {
      pages: 1,
      itemsPerPage: [itemCount],
      distribution: {
        firstPage: itemCount,
        middlePages: [],
        lastPage: 0
      }
    };
  }

  // Multi-page calculation
  let remainingItems = itemCount;
  const itemsPerPage = [];
  const middlePages = [];

  // Page 1: First page with customer info
  const itemsOnFirstPage = Math.min(remainingItems, maxItemsFirstPage);
  itemsPerPage.push(itemsOnFirstPage);
  remainingItems -= itemsOnFirstPage;

  // If all items fit on first page + last page sections
  if (remainingItems <= maxItemsLastPage) {
    // Items fit on 2 pages total
    itemsPerPage.push(remainingItems);
    return {
      pages: 2,
      itemsPerPage,
      distribution: {
        firstPage: itemsOnFirstPage,
        middlePages: [],
        lastPage: remainingItems
      }
    };
  }

  // Multiple middle pages needed
  // Calculate how many middle pages we need
  const itemsForMiddlePages = remainingItems - maxItemsLastPage;
  const middlePagesNeeded = Math.ceil(itemsForMiddlePages / maxItemsOtherPage);

  // Add middle pages
  for (let i = 0; i < middlePagesNeeded; i++) {
    const itemsThisPage = Math.min(remainingItems, maxItemsOtherPage);
    itemsPerPage.push(itemsThisPage);
    middlePages.push(itemsThisPage);
    remainingItems -= itemsThisPage;
  }

  // Last page with totals and signature
  if (remainingItems > 0) {
    itemsPerPage.push(remainingItems);
  }

  const totalPages = itemsPerPage.length;

  return {
    pages: totalPages,
    itemsPerPage,
    distribution: {
      firstPage: itemsOnFirstPage,
      middlePages,
      lastPage: remainingItems > 0 ? remainingItems : itemsPerPage[totalPages - 1]
    },
    limits: {
      maxItemsFirstPage,
      maxItemsOtherPage,
      maxItemsLastPage
    }
  };
}

/**
 * Split invoice items into pages based on pagination calculation
 * @param {Array} items - Array of invoice items
 * @param {Object} pagination - Pagination object from calculatePagination
 * @returns {Array} Array of page data objects
 */
export function splitItemsIntoPages(items, pagination) {
  const pages = [];
  let itemOffset = 0;

  for (let pageIndex = 0; pageIndex < pagination.pages; pageIndex++) {
    const itemsOnThisPage = pagination.itemsPerPage[pageIndex];
    const pageItems = items.slice(itemOffset, itemOffset + itemsOnThisPage);

    pages.push({
      pageNumber: pageIndex + 1,
      totalPages: pagination.pages,
      items: pageItems,
      isFirstPage: pageIndex === 0,
      isLastPage: pageIndex === pagination.pages - 1,
      isMiddlePage: pageIndex > 0 && pageIndex < pagination.pages - 1
    });

    itemOffset += itemsOnThisPage;
  }

  return pages;
}

/**
 * Get human-readable pagination summary
 * @param {Object} pagination - Pagination object
 * @returns {string} Summary text
 */
export function getPaginationSummary(pagination) {
  if (pagination.pages === 1) {
    return `Single page invoice with ${pagination.itemsPerPage[0]} items`;
  }

  const { firstPage, middlePages, lastPage } = pagination.distribution;
  const middlePageCount = middlePages.length;

  let summary = `${pagination.pages}-page invoice:\n`;
  summary += `- Page 1: ${firstPage} items (with customer info)\n`;

  if (middlePageCount > 0) {
    summary += `- Pages 2-${middlePageCount + 1}: ${middlePages.join(', ')} items (continued)\n`;
  }

  summary += `- Page ${pagination.pages}: ${lastPage} items (with totals & signature)`;

  return summary;
}

-- ============================================================================
-- E2E Test Data Setup - Invoice Stock Allocation Panel Tests
-- ============================================================================
-- Purpose: Create test data for invoice stock allocation E2E tests
-- Product: SS-316-Bar-Bright-30mm-6000mm (ID: 308)
-- Expected Result: 17 units across 4 batches in 3 warehouses
-- ============================================================================

-- Clean up existing test data (optional)
-- DELETE FROM stock_batches WHERE product_id = 308 AND batch_number LIKE 'BTH-%';

-- ============================================================================
-- 1. Ensure Test Product Exists
-- ============================================================================

INSERT INTO products (
  id,
  product_name,
  material_type,
  product_form,
  finish,
  outer_diameter,
  length,
  company_id,
  status,
  created_at,
  updated_at
) VALUES (
  308,
  'SS-316-Bar-Bright-30mm-6000mm',
  'SS-316',
  'Bar',
  'Bright',
  30,
  6000,
  1,  -- Company ID
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  status = 'ACTIVE',
  updated_at = NOW();

-- ============================================================================
-- 2. Ensure Test Warehouses Exist
-- ============================================================================

-- Main Warehouse (ID: 1)
INSERT INTO warehouses (
  id,
  name,
  location,
  company_id,
  status,
  created_at
) VALUES (
  1,
  'Main Warehouse',
  'Main Location',
  1,
  'ACTIVE',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = 'ACTIVE';

-- Dubai Branch Warehouse (ID: 2)
INSERT INTO warehouses (
  id,
  name,
  location,
  company_id,
  status,
  created_at
) VALUES (
  2,
  'Dubai Branch Warehouse',
  'Dubai',
  1,
  'ACTIVE',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = 'ACTIVE';

-- Abu Dhabi Warehouse (ID: 3)
INSERT INTO warehouses (
  id,
  name,
  location,
  company_id,
  status,
  created_at
) VALUES (
  3,
  'Abu Dhabi Warehouse',
  'Abu Dhabi',
  1,
  'ACTIVE',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = 'ACTIVE';

-- ============================================================================
-- 3. Create Stock Batches (FIFO Order)
-- ============================================================================
-- Total: 17 units across 4 batches
-- Main WH: 7 units (2 + 5 from two batches)
-- Dubai: 5 units
-- Abu Dhabi: 5 units
-- ============================================================================

-- Batch 1: Main Warehouse - 2 units (OLDEST - FIFO first)
INSERT INTO stock_batches (
  id,
  batch_number,
  product_id,
  warehouse_id,
  company_id,
  quantity_received,
  quantity_remaining,
  quantity_reserved,
  status,
  received_date,
  created_at,
  updated_at
) VALUES (
  1,
  'BTH-001',
  308,
  1,  -- Main Warehouse
  1,
  2,  -- Quantity received
  2,  -- Quantity remaining
  0,  -- Quantity reserved
  'ACTIVE',
  '2024-01-01 10:00:00',  -- Oldest date (FIFO first)
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  quantity_remaining = 2,
  quantity_reserved = 0,
  status = 'ACTIVE',
  updated_at = NOW();

-- Batch 3: Dubai Branch - 5 units (Second in FIFO)
INSERT INTO stock_batches (
  id,
  batch_number,
  product_id,
  warehouse_id,
  company_id,
  quantity_received,
  quantity_remaining,
  quantity_reserved,
  status,
  received_date,
  created_at,
  updated_at
) VALUES (
  3,
  'BTH-003',
  308,
  2,  -- Dubai Warehouse
  1,
  5,
  5,
  0,
  'ACTIVE',
  '2024-01-02 10:00:00',  -- Second oldest
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  quantity_remaining = 5,
  quantity_reserved = 0,
  status = 'ACTIVE',
  updated_at = NOW();

-- Batch 4: Abu Dhabi - 5 units (Third in FIFO)
INSERT INTO stock_batches (
  id,
  batch_number,
  product_id,
  warehouse_id,
  company_id,
  quantity_received,
  quantity_remaining,
  quantity_reserved,
  status,
  received_date,
  created_at,
  updated_at
) VALUES (
  4,
  'BTH-004',
  308,
  3,  -- Abu Dhabi Warehouse
  1,
  5,
  5,
  0,
  'ACTIVE',
  '2024-01-03 10:00:00',  -- Third oldest
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  quantity_remaining = 5,
  quantity_reserved = 0,
  status = 'ACTIVE',
  updated_at = NOW();

-- Batch 2: Main Warehouse - 5 units (NEWEST - FIFO last)
INSERT INTO stock_batches (
  id,
  batch_number,
  product_id,
  warehouse_id,
  company_id,
  quantity_received,
  quantity_remaining,
  quantity_reserved,
  status,
  received_date,
  created_at,
  updated_at
) VALUES (
  2,
  'BTH-002',
  308,
  1,  -- Main Warehouse
  1,
  5,
  5,
  0,
  'ACTIVE',
  '2024-01-04 10:00:00',  -- Newest date (FIFO last)
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  quantity_remaining = 5,
  quantity_reserved = 0,
  status = 'ACTIVE',
  updated_at = NOW();

-- ============================================================================
-- 4. Ensure Test Customer Exists
-- ============================================================================

INSERT INTO customers (
  id,
  customer_name,
  email,
  company_id,
  status,
  credit_limit,
  payment_terms,
  created_at,
  updated_at
) VALUES (
  1,
  'ABC Corporation',
  'abc@example.com',
  1,
  'ACTIVE',
  50000.00,
  'NET30',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  status = 'ACTIVE',
  updated_at = NOW();

-- ============================================================================
-- 5. Verification Queries
-- ============================================================================

-- Verify batches created correctly
SELECT
  sb.id,
  sb.batch_number,
  w.name AS warehouse_name,
  sb.quantity_remaining,
  sb.quantity_reserved,
  (sb.quantity_remaining - COALESCE(sb.quantity_reserved, 0)) AS quantity_available,
  sb.received_date,
  sb.status
FROM stock_batches sb
JOIN warehouses w ON sb.warehouse_id = w.id
WHERE sb.product_id = 308
  AND sb.status = 'ACTIVE'
  AND sb.company_id = 1
ORDER BY sb.received_date ASC;

-- Expected Result:
-- ┌────┬────────────┬─────────────────────────┬───────────────────┬──────────────────┬───────────────────────┬─────────────────────┬────────┐
-- │ id │ batch_num  │ warehouse_name          │ quantity_remaining│ quantity_reserved│ quantity_available    │ received_date       │ status │
-- ├────┼────────────┼─────────────────────────┼───────────────────┼──────────────────┼───────────────────────┼─────────────────────┼────────┤
-- │ 1  │ BTH-001    │ Main Warehouse          │ 2                 │ 0                │ 2                     │ 2024-01-01 10:00:00 │ ACTIVE │
-- │ 3  │ BTH-003    │ Dubai Branch Warehouse  │ 5                 │ 0                │ 5                     │ 2024-01-02 10:00:00 │ ACTIVE │
-- │ 4  │ BTH-004    │ Abu Dhabi Warehouse     │ 5                 │ 0                │ 5                     │ 2024-01-03 10:00:00 │ ACTIVE │
-- │ 2  │ BTH-002    │ Main Warehouse          │ 5                 │ 0                │ 5                     │ 2024-01-04 10:00:00 │ ACTIVE │
-- └────┴────────────┴─────────────────────────┴───────────────────┴──────────────────┴───────────────────────┴─────────────────────┴────────┘
-- Total: 17 units

-- Verify stock by warehouse
SELECT
  w.id,
  w.name AS warehouse_name,
  SUM(sb.quantity_remaining) AS total_quantity,
  SUM(sb.quantity_reserved) AS total_reserved,
  SUM(sb.quantity_remaining - COALESCE(sb.quantity_reserved, 0)) AS total_available
FROM warehouses w
LEFT JOIN stock_batches sb ON w.id = sb.warehouse_id
  AND sb.product_id = 308
  AND sb.status = 'ACTIVE'
  AND sb.company_id = 1
WHERE w.company_id = 1
  AND w.status = 'ACTIVE'
GROUP BY w.id, w.name
ORDER BY w.id;

-- Expected Result:
-- ┌────┬─────────────────────────┬────────────────┬───────────────┬────────────────┐
-- │ id │ warehouse_name          │ total_quantity │ total_reserved│ total_available│
-- ├────┼─────────────────────────┼────────────────┼───────────────┼────────────────┤
-- │ 1  │ Main Warehouse          │ 7              │ 0             │ 7              │
-- │ 2  │ Dubai Branch Warehouse  │ 5              │ 0             │ 5              │
-- │ 3  │ Abu Dhabi Warehouse     │ 5              │ 0             │ 5              │
-- └────┴─────────────────────────┴────────────────┴───────────────┴────────────────┘

-- ============================================================================
-- 6. Create Zero-Stock Test Product (for edge case testing)
-- ============================================================================

INSERT INTO products (
  id,
  product_name,
  material_type,
  product_form,
  company_id,
  status,
  created_at,
  updated_at
) VALUES (
  999,
  'Zero-Stock-Test-Product',
  'SS-304',
  'Bar',
  1,
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  status = 'ACTIVE',
  updated_at = NOW();

-- Verify zero-stock product has no batches
SELECT COUNT(*) AS batch_count
FROM stock_batches
WHERE product_id = 999
  AND status = 'ACTIVE'
  AND quantity_remaining > 0;
-- Expected: 0

-- ============================================================================
-- Test Data Summary
-- ============================================================================

-- Product: SS-316-Bar-Bright-30mm-6000mm (ID: 308)
-- Customer: ABC Corporation (ID: 1)
--
-- Stock Distribution:
--   Abu Dhabi Warehouse (ID: 3): 5 units
--   Dubai Branch Warehouse (ID: 2): 5 units
--   Main Warehouse (ID: 1): 7 units (2 + 5 from two batches)
--   Total: 17 units
--
-- Batches (FIFO order):
--   1. BTH-001: Main WH, 2 units (2024-01-01 - oldest)
--   2. BTH-003: Dubai, 5 units (2024-01-02)
--   3. BTH-004: Abu Dhabi, 5 units (2024-01-03)
--   4. BTH-002: Main WH, 5 units (2024-01-04 - newest)
--
-- Edge Case:
--   Zero-Stock-Test-Product (ID: 999): 0 units
--   Purpose: Verify "Local Drop Ship" shows for zero-stock products
--
-- ============================================================================

-- ============================================================================
-- Cleanup (Optional - for test reset)
-- ============================================================================

/*
-- Uncomment to clean up test data:

DELETE FROM stock_batches WHERE product_id IN (308, 999);
DELETE FROM products WHERE id IN (308, 999);
DELETE FROM customers WHERE id = 1;
DELETE FROM warehouses WHERE id IN (1, 2, 3);
*/

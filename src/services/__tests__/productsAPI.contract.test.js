/**
 * Products API Service Layer Contract Tests
 *
 * PURPOSE:
 * Validates that productsAPI methods automatically normalize product responses
 * at the service layer, ensuring all product data passes through the contract guard
 * before reaching UI components (GUARD #2 - Service Layer Integration).
 *
 * CRITICAL: This test ensures that:
 * 1. productsAPI.getAll() normalizes product arrays
 * 2. productsAPI.getById() normalizes single products
 * 3. productsAPI.search() normalizes search results
 * 4. All normalized products pass assertProductDomain()
 * 5. Components cannot bypass normalization by using API directly
 *
 * TEST STRATEGY:
 * - Mock axios/apiClient responses with snake_case data
 * - Call productsAPI methods
 * - Verify responses are normalized (camelCase)
 * - Verify no snake_case leaks
 * - Verify contract assertions pass
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from "../api.js";
// Mock apiClient to simulate backend responses
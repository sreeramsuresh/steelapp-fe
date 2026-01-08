/**
 * API Gateway Service Client for Integration Tests
 * Calls API Gateway (HTTP REST) which uses local PostgreSQL services
 *
 * CRITICAL: Tests MUST use this for "When" steps, not dbQuery()
 * This tests the full stack: test → API Gateway → PostgreSQL DB
 */

import { testLogger } from './utils/testLogger';
import type {
  ServiceClient,
  CreateInvoiceParams,
  CreateInvoiceResponse,
  RecordPaymentParams,
  RecordPaymentResponse,
  PostInvoiceParams,
  PostInvoiceResponse,
  CreateSupplierBillParams,
  CreateSupplierBillResponse,
  GenericApiResponse,
} from './types';

const apiBaseUrl = 'http://localhost:3000/api';

let client: ServiceClient | null = null;

/**
 * Initialize API Gateway service client
 * Verifies API Gateway is reachable
 */
export async function initGrpcClient(): Promise<ServiceClient> {
  try {
    // Test API Gateway health
    const response = await fetch(`${apiBaseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API Gateway returned ${response.status}`);
    }

    client = {
      baseUrl: apiBaseUrl,
      ready: true,
    };

    testLogger.success('API Gateway client initialized (PostgreSQL backend)');
    return client;
  } catch (error) {
    testLogger.error('Failed to initialize API Gateway client', { error: String(error) });
    throw error;
  }
}

/**
 * Get initialized service client
 */
export function getGrpcClient(): ServiceClient {
  if (!client) {
    throw new Error(
      'Service client not initialized. Call initGrpcClient() first.',
    );
  }
  return client;
}

/**
 * Call CreateInvoice via API Gateway (HTTP REST)
 */
export async function createInvoiceViaGrpc(
  params: CreateInvoiceParams,
): Promise<CreateInvoiceResponse> {
  const response = await fetch(`${apiBaseUrl}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Company-Id': params.company_id,
    },
    body: JSON.stringify({
      customer_id: params.customer_id,
      subtotal: params.subtotal,
      vat_rate: params.vat_rate,
      items: params.invoice_items || [],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CreateInvoice failed: ${response.status} - ${error}`);
  }

  return (await response.json()) as CreateInvoiceResponse;
}

/**
 * Call RecordPayment via API Gateway (HTTP REST)
 */
export async function recordPaymentViaGrpc(
  params: RecordPaymentParams,
): Promise<RecordPaymentResponse> {
  const response = await fetch(
    `${apiBaseUrl}/invoices/${params.invoice_id}/payments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Id': params.company_id,
      },
      body: JSON.stringify({
        amount: params.amount,
        payment_method: params.payment_method,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RecordPayment failed: ${response.status} - ${error}`);
  }

  return (await response.json()) as RecordPaymentResponse;
}

/**
 * Call PostInvoice via API Gateway (finalize and create journals)
 * CRITICAL for SF-6: Must be called before checking journal entries
 */
export async function postInvoiceViaGrpc(
  params: PostInvoiceParams,
): Promise<PostInvoiceResponse> {
  const response = await fetch(
    `${apiBaseUrl}/invoices/${params.invoice_id}/post`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Id': params.company_id,
      },
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PostInvoice failed: ${response.status} - ${error}`);
  }

  return (await response.json()) as PostInvoiceResponse;
}

/**
 * Call CreateSupplierBill via API Gateway
 * Used for FK integrity testing (SF-5)
 */
export async function createSupplierBillViaGrpc(
  params: CreateSupplierBillParams,
): Promise<CreateSupplierBillResponse> {
  const response = await fetch(`${apiBaseUrl}/supplier-bills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Company-Id': params.company_id,
    },
    body: JSON.stringify({
      supplier_id: params.supplier_id,
      amount: params.amount,
      bill_date: params.bill_date || new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CreateSupplierBill failed: ${response.status} - ${error}`);
  }

  return (await response.json()) as CreateSupplierBillResponse;
}

/**
 * Generic service call wrapper
 */
export async function callBackendService<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  params: Record<string, unknown>,
  companyId?: string,
): Promise<GenericApiResponse<T>> {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(companyId && { 'X-Company-Id': companyId }),
    },
    body:
      method !== 'GET' && method !== 'DELETE'
        ? JSON.stringify(params)
        : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Service call failed: ${response.status} - ${error}`);
  }

  return (await response.json()) as GenericApiResponse<T>;
}

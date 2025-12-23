/**
 * Backend Service Client for Integration Tests
 * Calls API Gateway (HTTP) which routes to gRPC backend
 *
 * CRITICAL: Tests MUST use this for "When" steps, not dbQuery()
 * This tests the full stack: test → API Gateway → gRPC backend → DB
 */

const apiBaseUrl = 'http://localhost:3000/api';
let client: any = null;

/**
 * Initialize backend service client
 * Verifies API Gateway is reachable
 */
export async function initGrpcClient(): Promise<any> {
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

    console.log('✓ API Gateway client initialized (routes to gRPC backend)');
    return client;
  } catch (error) {
    console.error('Failed to initialize backend service client:', error);
    throw error;
  }
}

/**
 * Get initialized service client
 */
export function getGrpcClient(): any {
  if (!client) {
    throw new Error(
      'Service client not initialized. Call initGrpcClient() first.',
    );
  }
  return client;
}

/**
 * Call CreateInvoice via API Gateway
 * Gateway routes to gRPC InvoiceService.CreateInvoice
 */
export async function createInvoiceViaGrpc(params: {
  customer_id: string;
  company_id: string;
  subtotal: number;
  vat_rate: number;
  invoice_items?: any[];
}): Promise<any> {
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

  return await response.json();
}

/**
 * Call RecordPayment via API Gateway
 */
export async function recordPaymentViaGrpc(params: {
  invoice_id: string;
  amount: number;
  payment_method: string;
  company_id: string;
}): Promise<any> {
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

  return await response.json();
}

/**
 * Call PostInvoice via API Gateway (finalize and create journals)
 * CRITICAL for SF-6: Must be called before checking journal entries
 */
export async function postInvoiceViaGrpc(params: {
  invoice_id: string;
  company_id: string;
}): Promise<any> {
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

  return await response.json();
}

/**
 * Call CreateVendorBill via API Gateway
 * Used for FK integrity testing (SF-5)
 */
export async function createVendorBillViaGrpc(params: {
  supplier_id: string;
  company_id: string;
  amount: number;
  bill_date?: string;
}): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/vendor-bills`, {
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
    throw new Error(`CreateVendorBill failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Generic service call wrapper
 */
export async function callBackendService(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  params: any,
  companyId?: string,
): Promise<any> {
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

  return await response.json();
}

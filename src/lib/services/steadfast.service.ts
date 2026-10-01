/**
 * Steadfast Courier API Integration Service
 * Base URL: https://portal.packzy.com/api/v1 (or https://portal.steadfast.com.bd/api/v1)
 */

interface CreateSteadfastOrderParams {
  invoice: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number;
  note?: string;
  itemDescription?: string;
}

interface SteadfastConsignment {
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  note?: string;
  created_at?: string;
}

interface SteadfastResponse {
  status: number;
  message?: string;
  consignment?: SteadfastConsignment;
  errors?: Record<string, string[]>;
}

export function formatBangladeshiPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove non-digit characters
  const digitsOnly = rawPhone.replace(/\D/g, '');
  // Take last 11 digits if starting with 880...
  if (digitsOnly.length >= 11) {
    return digitsOnly.slice(-11);
  }
  return digitsOnly;
}

export async function createSteadfastOrder(params: CreateSteadfastOrderParams): Promise<{
  success: boolean;
  trackingCode?: string;
  consignmentId?: number;
  error?: string;
  consignment?: SteadfastConsignment;
}> {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;
  const baseUrl = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';

  if (!apiKey || !secretKey) {
    return {
      success: false,
      error: 'Steadfast Courier API credentials are not configured in environment variables',
    };
  }

  const phone = formatBangladeshiPhone(params.recipientPhone);
  if (!phone || phone.length !== 11) {
    return {
      success: false,
      error: `Invalid phone number format: "${params.recipientPhone}". Steadfast requires an 11-digit Bangladeshi number (e.g. 017XXXXXXXX).`,
    };
  }

  const payload = {
    invoice: params.invoice,
    recipient_name: params.recipientName.slice(0, 100),
    recipient_phone: phone,
    recipient_address: params.recipientAddress.slice(0, 250),
    cod_amount: Math.max(0, Math.round(params.codAmount)),
    note: params.note ? params.note.slice(0, 400) : 'Gents Hood Package',
    item_description: params.itemDescription ? params.itemDescription.slice(0, 400) : undefined,
  };

  try {
    const res = await fetch(`${baseUrl}/create_order`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: SteadfastResponse = await res.json();

    if (data.status === 200 && data.consignment) {
      return {
        success: true,
        trackingCode: data.consignment.tracking_code,
        consignmentId: data.consignment.consignment_id,
        consignment: data.consignment,
      };
    }

    // Extract error message
    let errorMessage = data.message || 'Failed to create Steadfast order';
    if (data.errors && typeof data.errors === 'object') {
      const errorList = Object.values(data.errors).flat();
      if (errorList.length > 0) {
        errorMessage = errorList.join(', ');
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Steadfast API error:', error);
    return {
      success: false,
      error: 'Network connection to Steadfast Courier failed. Please try again.',
    };
  }
}

export async function getSteadfastBalance(): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;
  const baseUrl = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';

  if (!apiKey || !secretKey) {
    return { success: false, error: 'Credentials missing' };
  }

  try {
    const res = await fetch(`${baseUrl}/get_balance`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (data.status === 200 && typeof data.current_balance === 'number') {
      return { success: true, balance: data.current_balance };
    }
    return { success: false, error: data.message || 'Could not fetch balance' };
  } catch {
    return { success: false, error: 'Connection failed' };
  }
}

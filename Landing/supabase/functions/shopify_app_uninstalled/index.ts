import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  jsonResponse,
} from '../_shared/edge.ts';
import { normalizeShopifyDomainInput } from '../_shared/store-access.ts';

type ShopifyUninstallWebhookPayload = {
  domain?: string;
  myshopify_domain?: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function parseBody(raw: string): ShopifyUninstallWebhookPayload {
  try {
    return JSON.parse(raw) as ShopifyUninstallWebhookPayload;
  } catch {
    return {};
  }
}

function extractShopifyDomain(req: Request, rawBody: string): string | null {
  const shopHeader = req.headers.get('x-shopify-shop-domain');
  if (shopHeader?.trim()) {
    return normalizeShopifyDomainInput(shopHeader.trim());
  }

  const payload = parseBody(rawBody);
  const fromPayload = payload.myshopify_domain ?? payload.domain;

  if (!fromPayload?.trim()) {
    return null;
  }

  return normalizeShopifyDomainInput(fromPayload);
}

async function buildShopifyWebhookHmac(rawBody: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  return bytesToBase64(new Uint8Array(signature));
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }

  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const secret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET')?.trim();
  if (!secret) {
    return errorResponse(500, 'Missing SHOPIFY_WEBHOOK_SECRET');
  }

  const rawBody = await req.text();
  const incomingHmac = req.headers.get('x-shopify-hmac-sha256')?.trim();

  if (!incomingHmac) {
    return errorResponse(401, 'Unauthorized', 'MISSING_WEBHOOK_HMAC');
  }

  const expectedHmac = await buildShopifyWebhookHmac(rawBody, secret);
  if (!constantTimeEqual(incomingHmac, expectedHmac)) {
    return errorResponse(401, 'Unauthorized', 'INVALID_WEBHOOK_HMAC');
  }

  const shopifyDomain = extractShopifyDomain(req, rawBody);
  if (!shopifyDomain) {
    return errorResponse(422, 'Shopify domain not found in webhook payload');
  }

  const supabaseAdmin = getServiceClient();

  const { data, error } = await supabaseAdmin
    .from('store_shopify_credentials')
    .delete()
    .eq('shopify_domain', shopifyDomain)
    .select('domain');

  if (error) {
    return errorResponse(500, error.message || 'Failed to delete Shopify credentials');
  }

  return jsonResponse({
    ok: true,
    shopify_domain: shopifyDomain,
    revoked_domains: (data ?? []).map((row) => String(row.domain)),
  });
});

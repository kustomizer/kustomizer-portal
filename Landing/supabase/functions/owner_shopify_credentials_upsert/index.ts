import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type OwnerShopifyCredentialsUpsertRequest = {
  domain?: string;
  // Accept both names to ease integrations
  shopify_domain?: string;
  shop?: string;
  access_token?: string;
  accessToken?: string;
};

const SHOPIFY_API_VERSION = Deno.env.get('SHOPIFY_API_VERSION') ?? '2024-10';

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

let cachedCryptoKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) {
    return cachedCryptoKey;
  }

  const keyB64 = Deno.env.get('SHOPIFY_TOKEN_ENCRYPTION_KEY');
  if (!keyB64) {
    throw new Error('Missing SHOPIFY_TOKEN_ENCRYPTION_KEY');
  }

  const rawKey = base64ToBytes(keyB64);
  cachedCryptoKey = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt']);
  return cachedCryptoKey;
}

async function encryptAccessToken(token: string): Promise<{ ciphertextB64: string; ivB64: string }> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(token);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    ciphertextB64: bytesToBase64(new Uint8Array(ciphertext)),
    ivB64: bytesToBase64(iv),
  };
}

async function shopifyGraphQL(shopifyDomain: string, accessToken: string, query: string, variables?: unknown) {
  const url = `https://${shopifyDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const bodyText = await resp.text();

  if (!resp.ok) {
    return { ok: false as const, status: resp.status, body: bodyText };
  }

  try {
    const json = JSON.parse(bodyText);
    return { ok: true as const, json };
  } catch {
    return { ok: false as const, status: 500, body: bodyText };
  }
}

async function validateCredentials(shopifyDomain: string, accessToken: string): Promise<{ ok: boolean }> {
  // Validate using an operation that requires only read_metaobjects.
  // This keeps required scopes aligned with our integration (read/write_metaobjects).
  const query = `query { metaobjectDefinitions(first: 1) { edges { node { id type } } } }`;
  const resp = await shopifyGraphQL(shopifyDomain, accessToken, query);

  if (!resp.ok) {
    return { ok: false };
  }

  if (resp.json?.errors?.length) {
    return { ok: false };
  }

  return { ok: true };
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: OwnerShopifyCredentialsUpsertRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const domain = payload.domain?.trim();
  const shopifyDomain = (payload.shopify_domain ?? payload.shop)?.trim();
  const accessToken = (payload.access_token ?? payload.accessToken)?.trim();

  if (!domain || !shopifyDomain || !accessToken) {
    return errorResponse(
      422,
      'domain, shopify_domain (or shop), and access_token (or accessToken) are required'
    );
  }

  const user = await getUser(req);
  if (!user?.email) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: store, error: storeError } = await supabaseAdmin
    .from('stores')
    .select('owner_id')
    .eq('domain', domain)
    .maybeSingle();

  if (storeError || !store) {
    return errorResponse(404, 'Store not found');
  }

  if (store.owner_id !== user.email) {
    return errorResponse(403, 'Only owners can set Shopify credentials');
  }

  // Verify credentials against Shopify and extract a canonical domain if available.
  const credentialCheck = await validateCredentials(shopifyDomain, accessToken);
  if (!credentialCheck.ok) {
    return errorResponse(422, 'Invalid Shopify credentials');
  }

  const canonicalShopifyDomain = shopifyDomain;

  let encrypted;
  try {
    encrypted = await encryptAccessToken(accessToken);
  } catch (e) {
    return errorResponse(500, e instanceof Error ? e.message : 'Encryption failed');
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabaseAdmin.from('store_shopify_credentials').upsert({
    domain,
    shopify_domain: canonicalShopifyDomain,
    access_token_ciphertext: encrypted.ciphertextB64,
    access_token_iv: encrypted.ivB64,
    updated_at: now,
    last_validated_at: now,
  });

  if (upsertError) {
    return errorResponse(500, upsertError.message || 'Failed to save Shopify credentials');
  }

  return jsonResponse({
    ok: true,
    shopify_domain: canonicalShopifyDomain,
    last_validated_at: now,
  });
});

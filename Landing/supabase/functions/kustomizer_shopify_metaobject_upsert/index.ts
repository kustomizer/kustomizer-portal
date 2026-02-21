import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  jsonResponse,
} from '../_shared/edge.ts';
import { normalizeShopifyDomainInput, resolveStoreMembership } from '../_shared/store-access.ts';

type KustomizerShopifyMetaobjectUpsertRequest = {
  domain?: string;
  email?: string;
  handle?: {
    type?: string;
    handle?: string;
  };
  // Convenience aliases
  type?: string;
  metaobject_handle?: string;
  fields?: Array<{
    key: string;
    value: string;
  }>;
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

async function decryptAccessToken(ciphertextB64: string, ivB64: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = base64ToBytes(ivB64);
  const ciphertext = base64ToBytes(ciphertextB64);

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: KustomizerShopifyMetaobjectUpsertRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const domain = payload.domain?.trim();
  const email = payload.email?.trim();

  const metaobjectType = (payload.handle?.type ?? payload.type)?.trim();
  const metaobjectHandle = (payload.handle?.handle ?? payload.metaobject_handle)?.trim();
  const fields = payload.fields ?? [];

  if (!domain || !email) {
    return errorResponse(422, 'domain and email are required');
  }

  if (!metaobjectType || !metaobjectHandle) {
    return errorResponse(422, 'handle.type and handle.handle are required');
  }

  if (!Array.isArray(fields) || fields.length == 0) {
    return errorResponse(422, 'fields must be a non-empty array');
  }

  const supabaseAdmin = getServiceClient();

  const resolvedMembership = await resolveStoreMembership(supabaseAdmin, domain, email);

  if (!resolvedMembership) {
    return errorResponse(404, 'Store user not found');
  }

  const { storeUser, canonicalDomain, shopifyDomain: resolvedShopifyDomain } = resolvedMembership;

  if (storeUser.status !== 'active') {
    return errorResponse(403, 'User is not active');
  }

  const ownerEmail = storeUser.invited_by ?? storeUser.email;

  const { data: ownerProfile, error: ownerError } = await supabaseAdmin
    .from('users')
    .select('license_id')
    .eq('email', ownerEmail)
    .maybeSingle();

  if (ownerError || !ownerProfile?.license_id) {
    return errorResponse(404, 'License not found');
  }

  const { data: license, error: licenseError } = await supabaseAdmin
    .from('licenses')
    .select('license_id, tier, expires_at')
    .eq('license_id', ownerProfile.license_id)
    .maybeSingle();

  if (licenseError || !license) {
    return errorResponse(404, 'License not found');
  }

  const active = !license.expires_at || new Date(license.expires_at) > new Date();
  if (!active) {
    return errorResponse(403, 'License expired');
  }

  const { data: credsByDomain, error: credsByDomainError } = await supabaseAdmin
    .from('store_shopify_credentials')
    .select('shopify_domain, access_token_ciphertext, access_token_iv')
    .eq('domain', canonicalDomain)
    .maybeSingle();

  let creds = credsByDomain;

  if (!creds && !credsByDomainError) {
    const fallbackShopifyDomain = normalizeShopifyDomainInput(resolvedShopifyDomain ?? domain);

    const { data: credsByShopify } = await supabaseAdmin
      .from('store_shopify_credentials')
      .select('shopify_domain, access_token_ciphertext, access_token_iv')
      .eq('shopify_domain', fallbackShopifyDomain)
      .maybeSingle();

    creds = credsByShopify;
  }

  if (!creds) {
    return errorResponse(404, 'Shopify credentials not found');
  }

  let accessToken: string;
  try {
    accessToken = await decryptAccessToken(creds.access_token_ciphertext, creds.access_token_iv);
  } catch {
    return errorResponse(500, 'Failed to decrypt Shopify credentials');
  }

  const shopifyDomain = String(creds.shopify_domain);

  // Shopify Admin GraphQL: metaobjectUpsert (requires write_metaobjects)
  // https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectUpsert
  const mutation = `mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        id
        type
        handle
        fields {
          key
          value
        }
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

  const variables = {
    handle: {
      type: metaobjectType,
      handle: metaobjectHandle,
    },
    metaobject: {
      fields: fields.map((f) => ({ key: f.key, value: f.value })),
    },
  };

  const resp = await shopifyGraphQL(shopifyDomain, accessToken, mutation, variables);
  if (!resp.ok) {
    return errorResponse(502, 'Failed to call Shopify GraphQL');
  }

  const payloadData = resp.json?.data?.metaobjectUpsert;
  if (!payloadData) {
    return errorResponse(502, 'Invalid Shopify response');
  }

  return jsonResponse({
    ok: true,
    metaobject: payloadData.metaobject ?? null,
    userErrors: payloadData.userErrors ?? [],
  });
});

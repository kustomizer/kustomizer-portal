import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  jsonResponse,
} from '../_shared/edge.ts';
import { normalizeShopifyDomainInput, resolveStoreMembership } from '../_shared/store-access.ts';
import { decryptShopifyToken, encryptShopifyToken } from '../_shared/shopify-token-crypto.ts';

type KustomizerShopifyMetaobjectGetRequest = {
  domain?: string;
  email?: string;
  handle?: {
    type?: string;
    handle?: string;
  };
  // Convenience aliases
  type?: string;
  metaobject_handle?: string;
};

const SHOPIFY_API_VERSION = Deno.env.get('SHOPIFY_API_VERSION') ?? '2024-10';

type StoreCredentialRow = {
  shop_id: string | null;
  shopify_domain: string | null;
  access_token_ciphertext: string | null;
  access_token_iv: string | null;
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function persistPrimaryCiphertext(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  shopId: string,
  shopifyDomain: string,
  accessToken: string
) {
  const now = new Date().toISOString();
  const encrypted = await encryptShopifyToken(accessToken);

  const { error } = await supabaseAdmin.from('shop_credentials').upsert(
    {
      shop_id: shopId,
      shopify_domain: shopifyDomain,
      access_token_ciphertext: encrypted.ciphertextB64,
      access_token_iv: encrypted.ivB64,
      updated_at: now,
      last_validated_at: now,
    },
    { onConflict: 'shop_id' }
  );

  if (error) {
    throw new Error(error.message || `Failed to rewrite Shopify credentials for ${shopId}`);
  }
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

  let payload: KustomizerShopifyMetaobjectGetRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const domain = payload.domain?.trim();
  const email = payload.email?.trim();

  const metaobjectType = (payload.handle?.type ?? payload.type)?.trim();
  const metaobjectHandle = (payload.handle?.handle ?? payload.metaobject_handle)?.trim();

  if (!domain || !email) {
    return errorResponse(422, 'domain and email are required');
  }

  if (!metaobjectType || !metaobjectHandle) {
    return errorResponse(422, 'handle.type and handle.handle are required');
  }

  const supabaseAdmin = getServiceClient();

  const resolvedMembership = await resolveStoreMembership(supabaseAdmin, domain, email);

  if (!resolvedMembership) {
    return errorResponse(404, 'Store user not found');
  }

  const { shopUser, shopId, shopifyDomain: resolvedShopifyDomain, ownerEmail } = resolvedMembership;

  if (shopUser.status !== 'active') {
    return errorResponse(403, 'User is not active');
  }

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
    .from('shop_credentials')
    .select('shop_id, shopify_domain, access_token_ciphertext, access_token_iv')
    .eq('shop_id', shopId)
    .maybeSingle();

  let creds = credsByDomain;

  if (!creds && !credsByDomainError) {
    const fallbackShopifyDomain = normalizeShopifyDomainInput(resolvedShopifyDomain ?? domain);

    const { data: credsByShopify } = await supabaseAdmin
      .from('shop_credentials')
      .select('shop_id, shopify_domain, access_token_ciphertext, access_token_iv')
      .eq('shopify_domain', fallbackShopifyDomain)
      .maybeSingle();

    creds = credsByShopify;
  }

  if (!creds) {
    return errorResponse(404, 'Shopify credentials not found');
  }

  const credentialRow = creds as StoreCredentialRow;
  const shopifyDomain = asNonEmptyString(credentialRow.shopify_domain);
  const ciphertext = asNonEmptyString(credentialRow.access_token_ciphertext);
  const iv = asNonEmptyString(credentialRow.access_token_iv);

  if (!shopifyDomain || !ciphertext || !iv) {
    return errorResponse(404, 'Shopify credentials not found');
  }

  let accessToken: string;
  try {
    const decrypted = await decryptShopifyToken(ciphertext, iv);
    accessToken = decrypted.token;

    if (decrypted.keySource === 'legacy') {
      try {
        await persistPrimaryCiphertext(supabaseAdmin, shopId, shopifyDomain, accessToken);
      } catch {
        // Do not block editor reads when credential migration writeback fails.
      }
    }
  } catch {
    return errorResponse(
      409,
      'Shopify credentials require reconnect or key migration',
      'SHOPIFY_CREDENTIALS_RECONNECT_REQUIRED'
    );
  }

  // Shopify Admin GraphQL: metaobjectByHandle (requires read_metaobjects)
  // https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobjectByHandle
  const query = `query GetMetaobject($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id
      type
      handle
      fields {
        key
        value
      }
      updatedAt
    }
  }`;

  const variables = {
    handle: {
      type: metaobjectType,
      handle: metaobjectHandle,
    },
  };

  const resp = await shopifyGraphQL(shopifyDomain, accessToken, query, variables);
  if (!resp.ok) {
    return errorResponse(502, 'Failed to call Shopify GraphQL');
  }

  return jsonResponse({
    ok: true,
    metaobject: resp.json?.data?.metaobjectByHandle ?? null,
  });
});

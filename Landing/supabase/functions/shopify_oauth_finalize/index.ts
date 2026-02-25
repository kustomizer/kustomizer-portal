import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  jsonResponse,
} from '../_shared/edge.ts';
import { normalizeDomainInput, normalizeShopifyDomainInput } from '../_shared/store-access.ts';
import { encryptShopifyToken } from '../_shared/shopify-token-crypto.ts';

type ShopifyOAuthFinalizeRequest = {
  shopify_domain?: string;
  shop?: string;
  access_token?: string;
  accessToken?: string;
  domain?: string;
  owner_email?: string;
};

type LegacyShopRow = {
  owner_email: string | null;
  allowed_domains: string[] | null;
};

const SHOPIFY_API_VERSION = Deno.env.get('SHOPIFY_API_VERSION') ?? '2024-10';

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asLowercaseEmail(value: unknown): string | null {
  const email = asString(value);
  return email ? email.toLowerCase() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item): item is string => !!item)
    .map((item) => normalizeDomainInput(item));
}

function deriveDomainFromShopifyDomain(shopifyDomain: string): string {
  return normalizeDomainInput(shopifyDomain.replace(/\.myshopify\.com$/, ''));
}

function resolveDomainFromAllowedDomains(allowedDomains: string[], shopifyDomain: string): string {
  const preferred = allowedDomains.find((domain) => !domain.endsWith('.myshopify.com'));
  if (preferred) {
    return preferred;
  }

  if (allowedDomains.length > 0) {
    return allowedDomains[0];
  }

  return deriveDomainFromShopifyDomain(shopifyDomain);
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

async function validateCredentials(
  shopifyDomain: string,
  accessToken: string
): Promise<{ ok: boolean; canonicalShopifyDomain: string | null }> {
  const query = `query ValidateToken($handle: MetaobjectHandleInput!) {
    shop {
      myshopifyDomain
    }
    metaobjectByHandle(handle: $handle) {
      id
    }
  }`;

  const variables = {
    handle: {
      type: 'kustomizer_probe',
      handle: 'kustomizer-probe',
    },
  };

  const resp = await shopifyGraphQL(shopifyDomain, accessToken, query, variables);

  if (!resp.ok) {
    return { ok: false, canonicalShopifyDomain: null };
  }

  if (resp.json?.errors?.length) {
    return { ok: false, canonicalShopifyDomain: null };
  }

  const canonical = asString(resp.json?.data?.shop?.myshopifyDomain);

  return {
    ok: true,
    canonicalShopifyDomain: canonical ? normalizeShopifyDomainInput(canonical) : null,
  };
}

async function ensureUserLicense(supabaseAdmin: ReturnType<typeof getServiceClient>, email: string) {
  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from('users')
    .select('license_id')
    .eq('email', email)
    .maybeSingle();

  if (existingUserError) {
    throw new Error(existingUserError.message || 'Failed to load user profile');
  }

  if (existingUser?.license_id) {
    return existingUser.license_id as string;
  }

  const { data: license, error: licenseError } = await supabaseAdmin
    .from('licenses')
    .insert({ tier: 'starter' })
    .select('license_id')
    .single();

  if (licenseError || !license) {
    throw new Error(licenseError?.message || 'Failed to create starter license');
  }

  const { error: userUpsertError } = await supabaseAdmin.from('users').upsert({
    email,
    license_id: license.license_id,
    name: '',
    lastname: '',
  });

  if (userUpsertError) {
    throw new Error(userUpsertError.message || 'Failed to save user profile');
  }

  return license.license_id as string;
}

async function resolveLegacyShop(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  shopifyDomain: string
): Promise<{ ownerEmail: string | null; domain: string | null }> {
  const { data, error } = await supabaseAdmin
    .from('shops')
    .select('owner_email, allowed_domains')
    .ilike('shopify_domain', shopifyDomain)
    .maybeSingle();

  if (error || !data) {
    return { ownerEmail: null, domain: null };
  }

  const row = data as LegacyShopRow;
  const allowedDomains = asStringArray(row.allowed_domains);

  return {
    ownerEmail: asLowercaseEmail(row.owner_email),
    domain: resolveDomainFromAllowedDomains(allowedDomains, shopifyDomain),
  };
}

async function getExistingStoreOwnerByDomain(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  domain: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('owner_id')
    .eq('domain', domain)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return asLowercaseEmail((data as { owner_id?: unknown }).owner_id);
}

async function upsertOwnerStore(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  email: string,
  domain: string
) {
  const normalizedDomain = normalizeDomainInput(domain);

  const { error: storeError } = await supabaseAdmin.from('stores').upsert(
    {
      domain: normalizedDomain,
      name: normalizedDomain,
      owner_id: email,
    },
    { onConflict: 'domain' }
  );

  if (storeError) {
    throw new Error(storeError.message || `Failed to upsert store ${normalizedDomain}`);
  }

  const { error: storeUserError } = await supabaseAdmin.from('store_users').upsert(
    {
      domain: normalizedDomain,
      email,
      invited_by: null,
      role: 'owner',
      status: 'active',
    },
    { onConflict: 'domain,email' }
  );

  if (storeUserError) {
    throw new Error(storeUserError.message || `Failed to upsert store user for ${normalizedDomain}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const finalizeSecret = asString(Deno.env.get('SHOPIFY_OAUTH_FINALIZE_SECRET'));
  if (!finalizeSecret) {
    return errorResponse(500, 'Missing SHOPIFY_OAUTH_FINALIZE_SECRET');
  }

  const providedSecret = asString(req.headers.get('x-shopify-oauth-finalize-secret'));
  if (!providedSecret || providedSecret !== finalizeSecret) {
    return errorResponse(401, 'Unauthorized', 'INVALID_FINALIZE_SECRET');
  }

  let payload: ShopifyOAuthFinalizeRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const providedShop = asString(payload.shopify_domain ?? payload.shop);
  const accessToken = asString(payload.access_token ?? payload.accessToken);

  if (!providedShop || !accessToken) {
    return errorResponse(422, 'shopify_domain (or shop) and access_token (or accessToken) are required');
  }

  const normalizedShopifyDomain = normalizeShopifyDomainInput(providedShop);

  const credentialCheck = await validateCredentials(normalizedShopifyDomain, accessToken);
  if (!credentialCheck.ok) {
    return errorResponse(422, 'Invalid Shopify credentials');
  }

  const canonicalShopifyDomain = credentialCheck.canonicalShopifyDomain ?? normalizedShopifyDomain;

  const supabaseAdmin = getServiceClient();

  const legacyShop = await resolveLegacyShop(supabaseAdmin, canonicalShopifyDomain);

  const payloadDomain = asString(payload.domain);
  const normalizedPayloadDomain = payloadDomain ? normalizeDomainInput(payloadDomain) : null;

  const canonicalDomain =
    normalizedPayloadDomain ?? legacyShop.domain ?? deriveDomainFromShopifyDomain(canonicalShopifyDomain);

  let ownerEmail = asLowercaseEmail(payload.owner_email) ?? legacyShop.ownerEmail;
  if (!ownerEmail) {
    ownerEmail = await getExistingStoreOwnerByDomain(supabaseAdmin, canonicalDomain);
  }

  if (ownerEmail) {
    await ensureUserLicense(supabaseAdmin, ownerEmail);
    await upsertOwnerStore(supabaseAdmin, ownerEmail, canonicalDomain);
  }

  const encrypted = await encryptShopifyToken(accessToken);
  const now = new Date().toISOString();

  const { error: upsertError } = await supabaseAdmin.from('store_shopify_credentials').upsert(
    {
      domain: canonicalDomain,
      shopify_domain: canonicalShopifyDomain,
      access_token_ciphertext: encrypted.ciphertextB64,
      access_token_iv: encrypted.ivB64,
      updated_at: now,
      last_validated_at: now,
    },
    { onConflict: 'domain' }
  );

  if (upsertError) {
    return errorResponse(500, upsertError.message || 'Failed to save Shopify credentials');
  }

  return jsonResponse({
    ok: true,
    domain: canonicalDomain,
    shopify_domain: canonicalShopifyDomain,
    owner_email: ownerEmail,
  });
});

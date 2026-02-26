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
  owner_email?: string;
  store_name?: string;
  name?: string;
  domain?: string;
};

type ShopRow = {
  id: string;
  name: string;
  shopify_domain: string;
  owner_email: string;
  allowed_domains: string[];
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
    .filter((item): item is string => !!item);
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function deriveDomainFromShopifyDomain(shopifyDomain: string): string {
  return normalizeDomainInput(shopifyDomain.replace(/\.myshopify\.com$/, ''));
}

function buildAllowedDomains(shopifyDomain: string, explicitDomain: string | null, existing: string[]): string[] {
  const derivedDomain = deriveDomainFromShopifyDomain(shopifyDomain);
  const normalizedExplicit = explicitDomain ? normalizeDomainInput(explicitDomain) : null;

  const candidates = [
    ...existing.map((domain) => normalizeDomainInput(domain)),
    derivedDomain,
    shopifyDomain,
  ];

  if (normalizedExplicit) {
    candidates.push(normalizedExplicit);
  }

  return dedupeStrings(candidates.filter((domain) => domain.length > 0));
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

async function findShopByShopifyDomain(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  shopifyDomain: string
): Promise<ShopRow | null> {
  const { data, error } = await supabaseAdmin
    .from('shops')
    .select('id, name, shopify_domain, owner_email, allowed_domains')
    .ilike('shopify_domain', shopifyDomain)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),
    name: String(data.name ?? ''),
    shopify_domain: normalizeShopifyDomainInput(String(data.shopify_domain ?? shopifyDomain)),
    owner_email: String(data.owner_email ?? '').toLowerCase(),
    allowed_domains: asStringArray(data.allowed_domains),
  };
}

async function upsertShop(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  params: {
    shopifyDomain: string;
    ownerEmail: string;
    explicitDomain: string | null;
    storeName: string | null;
  }
): Promise<{ shopId: string; ownerEmail: string }> {
  const existing = await findShopByShopifyDomain(supabaseAdmin, params.shopifyDomain);
  const defaultName = deriveDomainFromShopifyDomain(params.shopifyDomain);
  const desiredName = params.storeName ?? existing?.name ?? defaultName;

  if (existing) {
    if (existing.owner_email && existing.owner_email !== params.ownerEmail) {
      throw new Error('OWNER_EMAIL_MISMATCH');
    }

    const allowedDomains = buildAllowedDomains(
      params.shopifyDomain,
      params.explicitDomain,
      existing.allowed_domains
    );

    const { error: updateError } = await supabaseAdmin
      .from('shops')
      .update({
        name: desiredName,
        owner_email: params.ownerEmail,
        shopify_domain: params.shopifyDomain,
        allowed_domains: allowedDomains,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(updateError.message || 'Failed to update shop');
    }

    return {
      shopId: existing.id,
      ownerEmail: params.ownerEmail,
    };
  }

  const allowedDomains = buildAllowedDomains(params.shopifyDomain, params.explicitDomain, []);

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('shops')
    .insert({
      name: desiredName,
      shopify_domain: params.shopifyDomain,
      owner_email: params.ownerEmail,
      allowed_domains: allowedDomains,
    })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    throw new Error(insertError?.message || 'Failed to create shop');
  }

  return {
    shopId: String(inserted.id),
    ownerEmail: params.ownerEmail,
  };
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

  const existingShop = await findShopByShopifyDomain(supabaseAdmin, canonicalShopifyDomain);
  const payloadOwnerEmail = asLowercaseEmail(payload.owner_email);
  const ownerEmail = payloadOwnerEmail ?? existingShop?.owner_email ?? null;

  if (!ownerEmail) {
    return errorResponse(422, 'owner_email is required for first-time shop install', 'OWNER_EMAIL_REQUIRED');
  }

  const explicitDomain = asString(payload.domain);
  const storeName = asString(payload.store_name ?? payload.name);

  try {
    await ensureUserLicense(supabaseAdmin, ownerEmail);

    const { shopId } = await upsertShop(supabaseAdmin, {
      shopifyDomain: canonicalShopifyDomain,
      ownerEmail,
      explicitDomain,
      storeName,
    });

    const { error: shopUserError } = await supabaseAdmin
      .from('shop_users')
      .upsert(
        {
          shop_id: shopId,
          email: ownerEmail,
          invited_by: null,
          role: 'owner',
          status: 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'shop_id,email' }
      );

    if (shopUserError) {
      return errorResponse(500, shopUserError.message || 'Failed to upsert owner membership');
    }

    const encrypted = await encryptShopifyToken(accessToken);
    const now = new Date().toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from('shop_credentials')
      .upsert(
        {
          shop_id: shopId,
          shopify_domain: canonicalShopifyDomain,
          access_token_ciphertext: encrypted.ciphertextB64,
          access_token_iv: encrypted.ivB64,
          updated_at: now,
          last_validated_at: now,
        },
        { onConflict: 'shop_id' }
      );

    if (upsertError) {
      return errorResponse(500, upsertError.message || 'Failed to save Shopify credentials');
    }

    return jsonResponse({
      ok: true,
      shop_id: shopId,
      shopify_domain: canonicalShopifyDomain,
      owner_email: ownerEmail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected finalize error';
    const isOwnerMismatch = message === 'OWNER_EMAIL_MISMATCH';
    const reason = isOwnerMismatch ? 'OWNER_EMAIL_MISMATCH' : undefined;
    return errorResponse(isOwnerMismatch ? 409 : 500, message, reason);
  }
});

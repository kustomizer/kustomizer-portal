import { corsHeaders, getServiceClient, getUser, jsonResponse } from '../_shared/edge.ts';
import { normalizeDomainInput, normalizeShopifyDomainInput } from '../_shared/store-access.ts';

type BootstrapShopRequest = {
  store_name?: string;
  shopify_domain?: string;
  domain?: string;
  tier?: string;
};

type Tier = 'starter' | 'growth' | 'enterprise';

type ExistingShopRow = {
  id: string;
  name: string;
  owner_email: string | null;
  allowed_domains: string[] | null;
};

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function resolveTier(rawTier: string | undefined): Tier {
  if (rawTier === 'growth' || rawTier === 'enterprise') {
    return rawTier;
  }
  return 'starter';
}

function deriveBaseDomain(shopifyDomain: string): string {
  return normalizeDomainInput(shopifyDomain.replace(/\.myshopify\.com$/, ''));
}

function errorJson(status: number, error: string, code?: string): Response {
  return new Response(JSON.stringify({ error, ...(code ? { code } : {}) }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorJson(405, 'Method not allowed');
  }

  let payload: BootstrapShopRequest;
  try {
    payload = await req.json();
  } catch {
    return errorJson(400, 'Invalid JSON body');
  }

  const storeName = asString(payload.store_name);
  const rawShopifyDomain = asString(payload.shopify_domain ?? payload.domain);

  if (!storeName || !rawShopifyDomain) {
    return errorJson(422, 'store_name and shopify_domain are required');
  }

  const user = await getUser(req);
  const userEmail = asString(user?.email)?.toLowerCase();

  if (!userEmail) {
    return errorJson(401, 'Unauthorized');
  }

  const tier = resolveTier(asString(payload.tier) ?? undefined);
  const shopifyDomain = normalizeShopifyDomainInput(rawShopifyDomain);
  const baseDomain = deriveBaseDomain(shopifyDomain);

  const supabaseAdmin = getServiceClient();

  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from('users')
    .select('license_id')
    .eq('email', userEmail)
    .maybeSingle();

  if (existingUserError) {
    return errorJson(500, existingUserError.message || 'Failed to load user profile');
  }

  let licenseId = asString(existingUser?.license_id);

  if (!licenseId) {
    const { data: license, error: licenseError } = await supabaseAdmin
      .from('licenses')
      .insert({ tier })
      .select('license_id')
      .single();

    if (licenseError || !license?.license_id) {
      return errorJson(500, licenseError?.message || 'Failed to create starter license');
    }

    licenseId = String(license.license_id);
  }

  const { error: upsertUserError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        email: userEmail,
        name: asString(user?.user_metadata?.['name']) ?? '',
        lastname: asString(user?.user_metadata?.['lastname']) ?? '',
        license_id: licenseId,
      },
      { onConflict: 'email' }
    );

  if (upsertUserError) {
    return errorJson(500, upsertUserError.message || 'Failed to upsert user profile');
  }

  const { data: existingShopRaw, error: existingShopError } = await supabaseAdmin
    .from('shops')
    .select('id, name, owner_email, allowed_domains')
    .eq('shopify_domain', shopifyDomain)
    .maybeSingle();

  if (existingShopError) {
    return errorJson(500, existingShopError.message || 'Failed to load existing shop');
  }

  const existingShop = (existingShopRaw ?? null) as ExistingShopRow | null;

  let shopId = asString(existingShop?.id);

  if (shopId) {
    const existingOwnerEmail = asString(existingShop?.owner_email)?.toLowerCase();
    if (existingOwnerEmail && existingOwnerEmail !== userEmail) {
      return errorJson(409, 'This store is already linked to an account', 'DOMAIN_ALREADY_EXISTS');
    }

    const allowedDomains = dedupe([
      ...asStringArray(existingShop?.allowed_domains),
      baseDomain,
      shopifyDomain,
    ]);

    const { error: updateShopError } = await supabaseAdmin
      .from('shops')
      .update({
        name: storeName || existingShop?.name || baseDomain,
        owner_email: userEmail,
        allowed_domains: allowedDomains,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (updateShopError) {
      return errorJson(500, updateShopError.message || 'Failed to update shop');
    }
  } else {
    const { data: insertedShop, error: insertShopError } = await supabaseAdmin
      .from('shops')
      .insert({
        name: storeName || baseDomain,
        shopify_domain: shopifyDomain,
        allowed_domains: [baseDomain, shopifyDomain],
        owner_email: userEmail,
      })
      .select('id')
      .single();

    if (insertShopError || !insertedShop?.id) {
      return errorJson(500, insertShopError?.message || 'Failed to create shop');
    }

    shopId = String(insertedShop.id);
  }

  const { error: upsertShopUserError } = await supabaseAdmin
    .from('shop_users')
    .upsert(
      {
        shop_id: shopId,
        email: userEmail,
        role: 'owner',
        status: 'active',
        invited_by: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'shop_id,email' }
    );

  if (upsertShopUserError) {
    return errorJson(500, upsertShopUserError.message || 'Failed to upsert owner membership');
  }

  return jsonResponse({
    success: true,
    shop_id: shopId,
    shopify_domain: shopifyDomain,
    license_id: licenseId,
  });
});

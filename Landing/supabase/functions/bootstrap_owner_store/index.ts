import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';
import { normalizeDomainInput, normalizeShopifyDomainInput } from '../_shared/store-access.ts';

type BootstrapOwnerStoreRequest = {
  store_name?: string;
  shopify_domain?: string;
  // Kept to support existing request payloads during refactor.
  domain?: string;
  tier?: string;
};

function isValidTier(tier?: string): tier is 'starter' | 'growth' | 'enterprise' {
  return tier === 'starter' || tier === 'growth' || tier === 'enterprise';
}

function deriveDomainFromShopifyDomain(shopifyDomain: string): string {
  return normalizeDomainInput(shopifyDomain.replace(/\.myshopify\.com$/, ''));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: BootstrapOwnerStoreRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const storeName = payload.store_name?.trim();
  const rawShopifyDomain = payload.shopify_domain?.trim() ?? payload.domain?.trim();
  const tier = payload.tier;

  if (!storeName || !rawShopifyDomain || !tier) {
    return errorResponse(422, 'store_name, shopify_domain, and tier are required');
  }

  if (!isValidTier(tier)) {
    return errorResponse(422, 'Invalid tier');
  }

  const user = await getUser(req);
  const userEmail = user?.email?.trim().toLowerCase();
  if (!userEmail) {
    return errorResponse(401, 'Unauthorized');
  }

  const shopifyDomain = normalizeShopifyDomainInput(rawShopifyDomain);
  const baseDomain = deriveDomainFromShopifyDomain(shopifyDomain);

  const supabaseAdmin = getServiceClient();

  const { data: existingShop } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('shopify_domain', shopifyDomain)
    .maybeSingle();

  if (existingShop) {
    return errorResponse(409, 'Shop already exists', 'SHOP_ALREADY_EXISTS');
  }

  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('license_id')
    .eq('email', userEmail)
    .maybeSingle();

  let licenseId = existingUser?.license_id ?? null;

  if (!licenseId) {
    const { data: license, error: licenseError } = await supabaseAdmin
      .from('licenses')
      .insert({ tier })
      .select('license_id')
      .single();

    if (licenseError || !license) {
      return errorResponse(500, licenseError?.message || 'Failed to create license');
    }

    licenseId = license.license_id;
  }

  const { error: upsertUserError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        email: userEmail,
        name: user.user_metadata?.['name'] ?? '',
        lastname: user.user_metadata?.['lastname'] ?? '',
        license_id: licenseId,
      },
      { onConflict: 'email' }
    );

  if (upsertUserError) {
    return errorResponse(500, upsertUserError.message);
  }

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .insert({
      name: storeName,
      shopify_domain: shopifyDomain,
      allowed_domains: [baseDomain, shopifyDomain],
      owner_email: userEmail,
    })
    .select('id, shopify_domain')
    .single();

  if (shopError || !shop) {
    return errorResponse(500, shopError?.message || 'Failed to create shop');
  }

  const { error: shopUserError } = await supabaseAdmin.from('shop_users').insert({
    shop_id: shop.id,
    email: userEmail,
    invited_by: null,
    role: 'owner',
    status: 'active',
  });

  if (shopUserError) {
    return errorResponse(500, shopUserError.message);
  }

  return jsonResponse({
    shop_id: shop.id,
    shopify_domain: shop.shopify_domain,
    license_id: licenseId,
  });
});

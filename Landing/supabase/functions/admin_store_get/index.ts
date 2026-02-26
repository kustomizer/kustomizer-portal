import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AdminStoreGetRequest = {
  shop_id?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: AdminStoreGetRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const shopId = payload.shop_id;
  if (!shopId) {
    return errorResponse(422, 'shop_id is required');
  }

  const user = await getUser(req);
  if (!user) {
    return errorResponse(401, 'Unauthorized');
  }

  if (!isAdminUser(user)) {
    return errorResponse(403, 'Admin access required');
  }

  const supabaseAdmin = getServiceClient();

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('id, shopify_domain, name, owner_email, created_at')
    .eq('id', shopId)
    .single();

  if (shopError || !shop) {
    return errorResponse(404, 'Shop not found');
  }

  const { data: ownerProfile } = await supabaseAdmin
    .from('users')
    .select('license_id')
    .eq('email', shop.owner_email)
    .maybeSingle();

  const { data: license } = ownerProfile?.license_id
    ? await supabaseAdmin
        .from('licenses')
        .select('license_id, tier, expires_at, created_at')
        .eq('license_id', ownerProfile.license_id)
        .maybeSingle()
    : { data: null };

  const { data: shopUsers } = await supabaseAdmin
    .from('shop_users')
    .select('shop_id, email, invited_by, role, status, created_at')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  const licensePayload = license
    ? {
        id: license.license_id,
        tier: license.tier,
        expires_at: license.expires_at ?? null,
        created_at: license.created_at,
      }
    : null;

  return jsonResponse({
    store: {
      id: shop.id,
      shopify_domain: shop.shopify_domain,
      name: shop.name,
      owner_email: shop.owner_email,
      created_at: shop.created_at,
    },
    license: licensePayload,
    store_users: shopUsers ?? [],
  });
});

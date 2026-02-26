import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type OwnerStoreConnectionsGetRequest = {
  shop_ids?: string[];
};

type StoreConnectionRow = {
  shop_id: string;
  name: string | null;
  owner_email: string | null;
  shopify_domain: string | null;
  connected: boolean;
  last_validated_at: string | null;
};

type ShopMembershipRow = {
  shop_id: string;
};

type ShopRow = {
  id: string;
  name: string | null;
  owner_email: string | null;
  shopify_domain: string | null;
};

type CredentialRow = {
  shop_id: string;
  shopify_domain: string | null;
  access_token_ciphertext: string | null;
  access_token_iv: string | null;
  last_validated_at: string | null;
};

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asShopIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: string[] = [];

  for (const item of value) {
    const shopId = asString(item);
    if (!shopId) {
      continue;
    }

    normalized.push(shopId);
  }

  return [...new Set(normalized)];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: OwnerStoreConnectionsGetRequest = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const user = await getUser(req);
  const userEmail = user?.email?.trim().toLowerCase();

  if (!userEmail) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('shop_users')
    .select('shop_id')
    .eq('email', userEmail)
    .eq('status', 'active');

  if (membershipError) {
    return errorResponse(500, membershipError.message || 'Failed to load shop memberships');
  }

  const authorizedShopIds = new Set(
    ((memberships ?? []) as ShopMembershipRow[])
      .map((row) => asString(row.shop_id))
      .filter((shopId): shopId is string => !!shopId)
  );

  const requestedShopIds = asShopIdArray(payload.shop_ids);

  const targetShopIds =
    requestedShopIds.length > 0
      ? requestedShopIds.filter((shopId) => authorizedShopIds.has(shopId))
      : Array.from(authorizedShopIds);

  if (targetShopIds.length === 0) {
    return jsonResponse({ connections: [] });
  }

  const { data: shops, error: shopsError } = await supabaseAdmin
    .from('shops')
    .select('id, name, owner_email, shopify_domain')
    .in('id', targetShopIds);

  if (shopsError) {
    return errorResponse(500, shopsError.message || 'Failed to load shops');
  }

  const { data: credentialRows, error: credentialError } = await supabaseAdmin
    .from('shop_credentials')
    .select('shop_id, shopify_domain, access_token_ciphertext, access_token_iv, last_validated_at')
    .in('shop_id', targetShopIds);

  if (credentialError) {
    return errorResponse(500, credentialError.message || 'Failed to load shop credentials');
  }

  const shopsById = new Map<string, ShopRow>();
  for (const row of (shops ?? []) as ShopRow[]) {
    shopsById.set(row.id, row);
  }

  const credentialsByShopId = new Map<string, CredentialRow>();
  for (const row of (credentialRows ?? []) as CredentialRow[]) {
    credentialsByShopId.set(row.shop_id, row);
  }

  const connections: StoreConnectionRow[] = targetShopIds.map((shopId) => {
    const shop = shopsById.get(shopId);
    const credential = credentialsByShopId.get(shopId);

    const hasCiphertext =
      typeof credential?.access_token_ciphertext === 'string' &&
      credential.access_token_ciphertext.length > 0;
    const hasIv =
      typeof credential?.access_token_iv === 'string' && credential.access_token_iv.length > 0;

    return {
      shop_id: shopId,
      name: shop?.name ?? null,
      owner_email: shop?.owner_email ?? null,
      shopify_domain: credential?.shopify_domain ?? shop?.shopify_domain ?? null,
      connected: hasCiphertext && hasIv,
      last_validated_at: credential?.last_validated_at ?? null,
    };
  });

  return jsonResponse({ connections });
});

import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AdminStoreUpdateRequest = {
  shop_id?: string;
  name?: string;
  owner_email?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: AdminStoreUpdateRequest;
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

  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.owner_email !== undefined) updateData.owner_email = payload.owner_email;

  if (Object.keys(updateData).length === 0) {
    return errorResponse(422, 'No fields to update');
  }

  const supabaseAdmin = getServiceClient();

  const { data: shop, error } = await supabaseAdmin
    .from('shops')
    .update(updateData)
    .eq('id', shopId)
    .select('id, shopify_domain, name, owner_email, created_at')
    .single();

  if (error || !shop) {
    return errorResponse(500, error?.message || 'Failed to update shop');
  }

  return jsonResponse({
    store: {
      id: shop.id,
      shopify_domain: shop.shopify_domain,
      name: shop.name,
      owner_email: shop.owner_email,
      created_at: shop.created_at,
    },
  });
});

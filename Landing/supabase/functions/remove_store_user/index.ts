import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type RemoveStoreUserRequest = {
  shop_id?: string;
  email?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: RemoveStoreUserRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const shopId = payload.shop_id?.trim();
  const email = payload.email?.trim().toLowerCase();

  if (!shopId || !email) {
    return errorResponse(422, 'shop_id and email are required');
  }

  const user = await getUser(req);
  const userEmail = user?.email?.trim().toLowerCase();
  if (!userEmail) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('owner_email')
    .eq('id', shopId)
    .single();

  if (shopError || !shop) {
    return errorResponse(404, 'Shop not found');
  }

  if (String(shop.owner_email ?? '').toLowerCase() !== userEmail) {
    return errorResponse(403, 'Only owners can remove users');
  }

  const { data: shopUser, error } = await supabaseAdmin
    .from('shop_users')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('shop_id', shopId)
    .eq('email', email)
    .select('shop_id, email, role, status')
    .single();

  if (error || !shopUser) {
    return errorResponse(500, error?.message || 'Failed to remove user');
  }

  return jsonResponse({
    shop_id: shopUser.shop_id,
    email: shopUser.email,
    role: shopUser.role,
    status: shopUser.status,
  });
});

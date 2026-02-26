import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AdminStoreDeleteRequest = {
  shop_id?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: AdminStoreDeleteRequest;
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

  const { error: shopUsersError } = await supabaseAdmin
    .from('shop_users')
    .delete()
    .eq('shop_id', shopId);

  if (shopUsersError) {
    return errorResponse(500, shopUsersError.message);
  }

  const { error: credentialsError } = await supabaseAdmin
    .from('shop_credentials')
    .delete()
    .eq('shop_id', shopId);

  if (credentialsError) {
    return errorResponse(500, credentialsError.message);
  }

  const { error: shopError } = await supabaseAdmin.from('shops').delete().eq('id', shopId);

  if (shopError) {
    return errorResponse(500, shopError.message);
  }

  return jsonResponse({});
});

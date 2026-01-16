import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AdminStoreGetRequest = {
  store_id?: string;
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

  const storeId = payload.store_id;
  if (!storeId) {
    return errorResponse(422, 'store_id is required');
  }

  const user = await getUser(req);
  if (!user) {
    return errorResponse(401, 'Unauthorized');
  }

  if (!isAdminUser(user)) {
    return errorResponse(403, 'Admin access required');
  }

  const supabaseAdmin = getServiceClient();

  const { data: store, error: storeError } = await supabaseAdmin
    .from('stores')
    .select('id, name, created_at, metadata')
    .eq('id', storeId)
    .single();

  if (storeError || !store) {
    return errorResponse(404, 'Store not found');
  }

  const { data: license } = await supabaseAdmin
    .from('licenses')
    .select('id, status, tier, limits, expires_at, created_at')
    .eq('store_id', storeId)
    .maybeSingle();

  const { data: memberships } = await supabaseAdmin
    .from('memberships')
    .select('id, user_id, email, role, status')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  return jsonResponse({
    store,
    license: license ?? null,
    memberships: memberships ?? [],
  });
});

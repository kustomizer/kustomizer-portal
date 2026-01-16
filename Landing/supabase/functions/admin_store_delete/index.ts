import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AdminStoreDeleteRequest = {
  store_id?: string;
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

  const { error: membershipsError } = await supabaseAdmin
    .from('memberships')
    .delete()
    .eq('store_id', storeId);

  if (membershipsError) {
    return errorResponse(500, membershipsError.message);
  }

  const { error: domainsError } = await supabaseAdmin
    .from('domains')
    .delete()
    .eq('store_id', storeId);

  if (domainsError) {
    return errorResponse(500, domainsError.message);
  }

  const { error: licensesError } = await supabaseAdmin
    .from('licenses')
    .delete()
    .eq('store_id', storeId);

  if (licensesError) {
    return errorResponse(500, licensesError.message);
  }

  const { error: storeError } = await supabaseAdmin
    .from('stores')
    .delete()
    .eq('id', storeId);

  if (storeError) {
    return errorResponse(500, storeError.message);
  }

  return jsonResponse({});
});

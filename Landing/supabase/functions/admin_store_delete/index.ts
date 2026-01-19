import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AdminStoreDeleteRequest = {
  domain?: string;
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

  const domain = payload.domain;
  if (!domain) {
    return errorResponse(422, 'domain is required');
  }

  const user = await getUser(req);
  if (!user) {
    return errorResponse(401, 'Unauthorized');
  }

  if (!isAdminUser(user)) {
    return errorResponse(403, 'Admin access required');
  }

  const supabaseAdmin = getServiceClient();

  const { error: storeUsersError } = await supabaseAdmin
    .from('store_users')
    .delete()
    .eq('domain', domain);

  if (storeUsersError) {
    return errorResponse(500, storeUsersError.message);
  }

  const { error: storeError } = await supabaseAdmin
    .from('stores')
    .delete()
    .eq('domain', domain);

  if (storeError) {
    return errorResponse(500, storeError.message);
  }

  return jsonResponse({});
});

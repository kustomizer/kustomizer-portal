import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type RemoveStoreUserRequest = {
  domain?: string;
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

  const domain = payload.domain?.trim();
  const email = payload.email?.trim();

  if (!domain || !email) {
    return errorResponse(422, 'domain and email are required');
  }

  const user = await getUser(req);
  if (!user?.email) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: store, error: storeError } = await supabaseAdmin
    .from('stores')
    .select('owner_id')
    .eq('domain', domain)
    .single();

  if (storeError || !store) {
    return errorResponse(404, 'Store not found');
  }

  if (store.owner_id !== user.email) {
    return errorResponse(403, 'Only owners can remove users');
  }

  const { data: storeUser, error } = await supabaseAdmin
    .from('store_users')
    .update({ status: 'removed' })
    .eq('domain', domain)
    .eq('email', email)
    .select('domain, email, role, status')
    .single();

  if (error || !storeUser) {
    return errorResponse(500, error?.message || 'Failed to remove user');
  }

  return jsonResponse({
    domain: storeUser.domain,
    email: storeUser.email,
    role: storeUser.role,
    status: storeUser.status,
  });
});

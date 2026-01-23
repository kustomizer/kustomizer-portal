import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AdminStoreUpdateRequest = {
  domain?: string;
  name?: string;
  owner_id?: string;
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

  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.owner_id !== undefined) updateData.owner_id = payload.owner_id;

  if (Object.keys(updateData).length === 0) {
    return errorResponse(422, 'No fields to update');
  }

  const supabaseAdmin = getServiceClient();

  const { data: store, error } = await supabaseAdmin
    .from('stores')
    .update(updateData)
    .eq('domain', domain)
    .select('domain, name, owner_id, created_at')
    .single();

  if (error || !store) {
    return errorResponse(500, error?.message || 'Failed to update store');
  }

  return jsonResponse({ store });
});

import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AdminStoreGetRequest = {
  domain?: string;
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

  const { data: store, error: storeError } = await supabaseAdmin
    .from('stores')
    .select('domain, name, owner_id, created_at')
    .eq('domain', domain)
    .single();

  if (storeError || !store) {
    return errorResponse(404, 'Store not found');
  }

  const { data: ownerProfile } = await supabaseAdmin
    .from('users')
    .select('license_id')
    .eq('email', store.owner_id)
    .maybeSingle();

  const { data: license } = ownerProfile?.license_id
    ? await supabaseAdmin
        .from('licenses')
        .select('license_id, tier, expires_at, created_at')
        .eq('license_id', ownerProfile.license_id)
        .maybeSingle()
    : { data: null };

  const { data: storeUsers } = await supabaseAdmin
    .from('store_users')
    .select('email, invited_by, role, status, created_at')
    .eq('domain', domain)
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
    store,
    license: licensePayload,
    store_users: storeUsers ?? [],
  });
});

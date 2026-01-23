import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type BootstrapOwnerStoreRequest = {
  store_name?: string;
  domain?: string;
  tier?: string;
};

function isValidTier(tier?: string): tier is 'starter' | 'growth' | 'enterprise' {
  return tier === 'starter' || tier === 'growth' || tier === 'enterprise';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: BootstrapOwnerStoreRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const storeName = payload.store_name?.trim();
  const domain = payload.domain?.trim();
  const tier = payload.tier;

  if (!storeName || !domain || !tier) {
    return errorResponse(422, 'store_name, domain, and tier are required');
  }

  if (!isValidTier(tier)) {
    return errorResponse(422, 'Invalid tier');
  }

  const user = await getUser(req);
  if (!user?.email) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: existingStore } = await supabaseAdmin
    .from('stores')
    .select('domain')
    .eq('domain', domain)
    .maybeSingle();

  if (existingStore) {
    return errorResponse(409, 'Store domain already exists', 'DOMAIN_ALREADY_EXISTS');
  }

  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('license_id')
    .eq('email', user.email)
    .maybeSingle();

  let licenseId = existingUser?.license_id ?? null;

  if (!licenseId) {
    const { data: license, error: licenseError } = await supabaseAdmin
      .from('licenses')
      .insert({ tier })
      .select('license_id')
      .single();

    if (licenseError || !license) {
      return errorResponse(500, licenseError?.message || 'Failed to create license');
    }

    licenseId = license.license_id;
  }

  const { error: upsertUserError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        email: user.email,
        name: user.user_metadata?.['name'] ?? '',
        lastname: user.user_metadata?.['lastname'] ?? '',
        license_id: licenseId,
      },
      { onConflict: 'email' }
    );

  if (upsertUserError) {
    return errorResponse(500, upsertUserError.message);
  }

  const { error: storeError } = await supabaseAdmin
    .from('stores')
    .insert({
      domain,
      name: storeName,
      owner_id: user.email,
    });

  if (storeError) {
    return errorResponse(500, storeError.message);
  }

  const { error: storeUserError } = await supabaseAdmin.from('store_users').insert({
    domain,
    email: user.email,
    invited_by: null,
    role: 'owner',
    status: 'active',
  });

  if (storeUserError) {
    return errorResponse(500, storeUserError.message);
  }

  return jsonResponse({
    store_domain: domain,
    license_id: licenseId,
  });
});

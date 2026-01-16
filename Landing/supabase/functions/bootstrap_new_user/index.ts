import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type BootstrapRequest = {
  store_name?: string;
  tier?: number;
};

type Limits = {
  stores: number;
  domainsPerStore: number;
  seats: number;
};

function getLimitsForTier(tier: number): Limits {
  switch (tier) {
    case 1:
      return { stores: 3, domainsPerStore: 10, seats: 12 };
    case 2:
      return { stores: 9999, domainsPerStore: 9999, seats: 9999 };
    default:
      return { stores: 1, domainsPerStore: 3, seats: 3 };
  }
}

function getTrialExpiration(): string | null {
  const days = 14;
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + days);
  return expires.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: BootstrapRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const storeName = payload.store_name?.trim();
  const tier = payload.tier ?? 0;

  if (!storeName) {
    return errorResponse(422, 'store_name is required');
  }

  if (![0, 1, 2].includes(tier)) {
    return errorResponse(422, 'tier must be 0, 1, or 2');
  }

  const user = await getUser(req);
  if (!user) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: existingMemberships, error: membershipError } = await supabaseAdmin
    .from('memberships')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 1)
    .limit(1);

  if (membershipError) {
    return errorResponse(500, membershipError.message);
  }

  if (existingMemberships && existingMemberships.length > 0) {
    return errorResponse(409, 'User already has an active store');
  }

  const { data: store, error: storeError } = await supabaseAdmin
    .from('stores')
    .insert({
      name: storeName,
      metadata: {
        createdBy: user.id,
      },
    })
    .select()
    .single();

  if (storeError || !store) {
    return errorResponse(500, storeError?.message || 'Failed to create store');
  }

  const limits = getLimitsForTier(tier);
  const expiresAt = tier === 0 ? getTrialExpiration() : null;

  const { data: license, error: licenseError } = await supabaseAdmin
    .from('licenses')
    .insert({
      store_id: store.id,
      status: 0,
      tier,
      limits,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (licenseError || !license) {
    await supabaseAdmin.from('stores').delete().eq('id', store.id);
    return errorResponse(500, licenseError?.message || 'Failed to create license');
  }

  const { data: membership, error: membershipInsertError } = await supabaseAdmin
    .from('memberships')
    .insert({
      store_id: store.id,
      user_id: user.id,
      email: user.email,
      role: 0,
      status: 1,
    })
    .select()
    .single();

  if (membershipInsertError || !membership) {
    await supabaseAdmin.from('licenses').delete().eq('id', license.id);
    await supabaseAdmin.from('stores').delete().eq('id', store.id);
    return errorResponse(500, membershipInsertError?.message || 'Failed to create membership');
  }

  return jsonResponse({
    store_id: store.id,
    license_id: license.id,
    membership_id: membership.id,
  });
});

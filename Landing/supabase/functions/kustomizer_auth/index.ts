import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  jsonResponse,
} from '../_shared/edge.ts';
import { resolveStoreMembership } from '../_shared/store-access.ts';

type KustomizerAuthRequest = {
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

  let payload: KustomizerAuthRequest;
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

  const supabaseAdmin = getServiceClient();

  const resolvedMembership = await resolveStoreMembership(supabaseAdmin, domain, email);

  if (!resolvedMembership) {
    return errorResponse(404, 'Store user not found');
  }

  const { storeUser } = resolvedMembership;

  if (storeUser.status !== 'active') {
    return errorResponse(403, 'User is not active');
  }

  const ownerEmail = storeUser.invited_by ?? storeUser.email;

  const { data: ownerProfile, error: ownerError } = await supabaseAdmin
    .from('users')
    .select('license_id')
    .eq('email', ownerEmail)
    .maybeSingle();

  if (ownerError || !ownerProfile?.license_id) {
    return errorResponse(404, 'License not found');
  }

  const { data: license, error: licenseError } = await supabaseAdmin
    .from('licenses')
    .select('license_id, tier, expires_at')
    .eq('license_id', ownerProfile.license_id)
    .maybeSingle();

  if (licenseError || !license) {
    return errorResponse(404, 'License not found');
  }

  const active = !license.expires_at || new Date(license.expires_at) > new Date();

  if (!active) {
    return errorResponse(403, 'License expired');
  }

  const resolvedRole = storeUser.role === 'owner' ? 'admin' : storeUser.role;

  return jsonResponse({
    store_user: {
      role: resolvedRole,
      status: storeUser.status,
    },
    license: {
      active,
      expiresAt: license.expires_at ?? null,
      tier: license.tier,
    },
  });
});

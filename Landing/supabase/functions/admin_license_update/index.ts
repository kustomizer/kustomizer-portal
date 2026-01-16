import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AdminLicenseUpdateRequest = {
  license_id?: string;
  status?: number;
  tier?: number;
  limits?: Record<string, unknown>;
  expires_at?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: AdminLicenseUpdateRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const licenseId = payload.license_id;
  if (!licenseId) {
    return errorResponse(422, 'license_id is required');
  }

  const user = await getUser(req);
  if (!user) {
    return errorResponse(401, 'Unauthorized');
  }

  if (!isAdminUser(user)) {
    return errorResponse(403, 'Admin access required');
  }

  const updateData: Record<string, unknown> = {};
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.tier !== undefined) updateData.tier = payload.tier;
  if (payload.limits !== undefined) updateData.limits = payload.limits;
  if (payload.expires_at !== undefined) updateData.expires_at = payload.expires_at;

  if (Object.keys(updateData).length === 0) {
    return errorResponse(422, 'No fields to update');
  }

  const supabaseAdmin = getServiceClient();

  const { data: license, error } = await supabaseAdmin
    .from('licenses')
    .update(updateData)
    .eq('id', licenseId)
    .select('id, store_id, status, tier, limits, expires_at, created_at')
    .single();

  if (error || !license) {
    return errorResponse(500, error?.message || 'Failed to update license');
  }

  return jsonResponse({ license });
});

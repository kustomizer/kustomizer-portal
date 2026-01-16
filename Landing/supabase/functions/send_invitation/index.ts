import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type SendInvitationRequest = {
  store_id?: string;
  email?: string;
  role?: number;
  expires_in_days?: number;
};

function buildInviteUrl(req: Request, membershipKey: string): string {
  const siteUrl =
    Deno.env.get('SITE_URL') ||
    req.headers.get('origin') ||
    'http://localhost:4200';
  return `${siteUrl.replace(/\/$/, '')}/invite/${membershipKey}`;
}

function addDays(days?: number): string | null {
  if (!days || days <= 0) {
    return null;
  }
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

  let payload: SendInvitationRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const storeId = payload.store_id;
  const email = payload.email?.trim();
  const role = payload.role ?? 2;
  const expiresInDays = payload.expires_in_days;

  if (!storeId) {
    return errorResponse(422, 'store_id is required');
  }

  if (!email) {
    return errorResponse(422, 'email is required');
  }

  if (![0, 1, 2].includes(role)) {
    return errorResponse(422, 'role must be 0, 1, or 2');
  }

  const user = await getUser(req);
  if (!user) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: inviterMembership, error: inviterError } = await supabaseAdmin
    .from('memberships')
    .select('id, role, status')
    .eq('store_id', storeId)
    .eq('user_id', user.id)
    .eq('status', 1)
    .single();

  if (inviterError || !inviterMembership) {
    return errorResponse(403, 'Not allowed to invite members');
  }

  if (![0, 1].includes(inviterMembership.role)) {
    return errorResponse(403, 'Only owners or admins can invite members');
  }

  const membershipKey = crypto.randomUUID();
  const expiresAt = addDays(expiresInDays);

  const { data: membership, error: insertError } = await supabaseAdmin
    .from('memberships')
    .insert({
      store_id: storeId,
      email,
      role,
      status: 0,
      membership_key: membershipKey,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (insertError || !membership) {
    return errorResponse(500, insertError?.message || 'Failed to create invitation');
  }

  return jsonResponse({
    invite_url: buildInviteUrl(req, membershipKey),
    membership_key: membershipKey,
  });
});

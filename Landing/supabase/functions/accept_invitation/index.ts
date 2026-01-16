import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type AcceptInvitationRequest = {
  membership_key?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: AcceptInvitationRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const membershipKey = payload.membership_key?.trim();
  if (!membershipKey) {
    return errorResponse(422, 'membership_key is required');
  }

  const user = await getUser(req);
  if (!user) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('memberships')
    .select('id, store_id, email, status, expires_at, user_id')
    .eq('membership_key', membershipKey)
    .single();

  if (membershipError || !membership) {
    return errorResponse(404, 'Invitation not found');
  }

  if (membership.status !== 0) {
    return errorResponse(409, 'Invitation is no longer available');
  }

  if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
    return errorResponse(409, 'Invitation has expired');
  }

  if (membership.email && user.email && membership.email.toLowerCase() !== user.email.toLowerCase()) {
    return errorResponse(403, 'Invitation email does not match your account');
  }

  const { error: updateError } = await supabaseAdmin
    .from('memberships')
    .update({
      user_id: user.id,
      status: 1,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', membership.id);

  if (updateError) {
    return errorResponse(500, updateError.message);
  }

  return jsonResponse({
    membership_id: membership.id,
    store_id: membership.store_id,
  });
});

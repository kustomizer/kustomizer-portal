import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type InviteStoreUserRequest = {
  domain?: string;
  email?: string;
  role?: string;
};

function isValidRole(role?: string): role is 'admin' | 'reader' {
  return role === 'admin' || role === 'reader';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: InviteStoreUserRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const domain = payload.domain?.trim();
  const email = payload.email?.trim();
  const role = payload.role;

  if (!domain || !email || !role) {
    return errorResponse(422, 'domain, email, and role are required');
  }

  if (!isValidRole(role)) {
    return errorResponse(422, 'Invalid role');
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
    return errorResponse(403, 'Only owners can invite users');
  }

  const { error: upsertUserError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        email,
        name: '',
        lastname: '',
      },
      { onConflict: 'email' }
    );

  if (upsertUserError) {
    return errorResponse(500, upsertUserError.message);
  }

  const { data: storeUser, error } = await supabaseAdmin
    .from('store_users')
    .insert({
      domain,
      email,
      invited_by: user.email,
      role,
      status: 'active',
    })
    .select('domain, email, role, status')
    .single();

  if (error || !storeUser) {
    return errorResponse(500, error?.message || 'Failed to invite user');
  }

  return jsonResponse({
    domain: storeUser.domain,
    email: storeUser.email,
    role: storeUser.role,
    status: storeUser.status,
  });
});

import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';

type InviteStoreUserRequest = {
  shop_id?: string;
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

  const shopId = payload.shop_id?.trim();
  const email = payload.email?.trim().toLowerCase();
  const role = payload.role;

  if (!shopId || !email || !role) {
    return errorResponse(422, 'shop_id, email, and role are required');
  }

  if (!isValidRole(role)) {
    return errorResponse(422, 'Invalid role');
  }

  const user = await getUser(req);
  const userEmail = user?.email?.trim().toLowerCase();
  if (!userEmail) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('owner_email')
    .eq('id', shopId)
    .single();

  if (shopError || !shop) {
    return errorResponse(404, 'Shop not found');
  }

  if (String(shop.owner_email ?? '').toLowerCase() !== userEmail) {
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

  const { data: shopUser, error } = await supabaseAdmin
    .from('shop_users')
    .upsert(
      {
        shop_id: shopId,
        email,
        invited_by: userEmail,
        role,
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'shop_id,email' }
    )
    .select('shop_id, email, role, status')
    .single();

  if (error || !shopUser) {
    return errorResponse(500, error?.message || 'Failed to invite user');
  }

  return jsonResponse({
    shop_id: shopUser.shop_id,
    email: shopUser.email,
    role: shopUser.role,
    status: shopUser.status,
  });
});

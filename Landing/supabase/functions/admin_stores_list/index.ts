import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  isAdminUser,
  jsonResponse,
} from '../_shared/edge.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const user = await getUser(req);
  if (!user) {
    return errorResponse(401, 'Unauthorized');
  }

  if (!isAdminUser(user)) {
    return errorResponse(403, 'Admin access required');
  }

  const supabaseAdmin = getServiceClient();
  const { data: stores, error } = await supabaseAdmin
    .from('stores')
    .select('id, name, created_at, metadata')
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse(500, error.message);
  }

  return jsonResponse({ stores: stores ?? [] });
});

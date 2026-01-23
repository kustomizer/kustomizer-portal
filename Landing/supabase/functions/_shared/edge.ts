import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY');
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function errorResponse(status: number, message: string, reason?: string): Response {
  return jsonResponse({ message, ...(reason ? { reason } : {}) }, status);
}

export function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export function getUserClient(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export async function getUser(req: Request) {
  const supabase = getUserClient(req);
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
}

export function isAdminUser(user: { app_metadata?: Record<string, unknown> } | null): boolean {
  const role = user?.app_metadata?.['role'];
  return role === 'admin';
}

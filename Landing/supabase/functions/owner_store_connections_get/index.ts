import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';
import { normalizeDomainInput } from '../_shared/store-access.ts';

type OwnerStoreConnectionsGetRequest = {
  domains?: string[];
};

type StoreConnectionRow = {
  domain: string;
  shopify_domain: string | null;
  connected: boolean;
  last_validated_at: string | null;
};

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asDomainArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: string[] = [];

  for (const item of value) {
    const domain = asString(item);
    if (!domain) {
      continue;
    }

    normalized.push(normalizeDomainInput(domain));
  }

  return [...new Set(normalized)];
}

type CredentialRow = {
  domain: string;
  shopify_domain: string | null;
  access_token_ciphertext: string | null;
  access_token_iv: string | null;
  last_validated_at: string | null;
};

type LegacyStoreRow = {
  domain: string;
  shopify_domain: string | null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: OwnerStoreConnectionsGetRequest = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const user = await getUser(req);
  const userEmail = user?.email?.trim().toLowerCase();

  if (!userEmail) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('store_users')
    .select('domain, status')
    .eq('email', userEmail)
    .eq('status', 'active');

  if (membershipError) {
    return errorResponse(500, membershipError.message || 'Failed to load store memberships');
  }

  const authorizedDomains = new Set(
    (memberships ?? [])
      .map((row) => asString((row as { domain?: unknown }).domain))
      .filter((domain): domain is string => !!domain)
      .map((domain) => normalizeDomainInput(domain))
  );

  const requestedDomains = asDomainArray(payload.domains);

  const targetDomains =
    requestedDomains.length > 0
      ? requestedDomains.filter((domain) => authorizedDomains.has(domain))
      : Array.from(authorizedDomains);

  if (targetDomains.length === 0) {
    return jsonResponse({ connections: [] });
  }

  const { data: credentialRows, error: credentialError } = await supabaseAdmin
    .from('store_shopify_credentials')
    .select('domain, shopify_domain, access_token_ciphertext, access_token_iv, last_validated_at')
    .in('domain', targetDomains);

  if (credentialError) {
    return errorResponse(500, credentialError.message || 'Failed to load store credentials');
  }

  const { data: legacyRows, error: legacyError } = await supabaseAdmin
    .from('v_legacy_stores')
    .select('domain, shopify_domain')
    .in('domain', targetDomains);

  if (legacyError) {
    return errorResponse(500, legacyError.message || 'Failed to load legacy store mappings');
  }

  const credentialsByDomain = new Map<string, CredentialRow>();
  for (const row of (credentialRows ?? []) as CredentialRow[]) {
    credentialsByDomain.set(normalizeDomainInput(row.domain), row);
  }

  const legacyByDomain = new Map<string, LegacyStoreRow>();
  for (const row of (legacyRows ?? []) as LegacyStoreRow[]) {
    legacyByDomain.set(normalizeDomainInput(row.domain), row);
  }

  const connections: StoreConnectionRow[] = targetDomains.map((domain) => {
    const credential = credentialsByDomain.get(domain);
    const legacy = legacyByDomain.get(domain);

    const hasCiphertext =
      typeof credential?.access_token_ciphertext === 'string' &&
      credential.access_token_ciphertext.length > 0;
    const hasIv = typeof credential?.access_token_iv === 'string' && credential.access_token_iv.length > 0;

    return {
      domain,
      shopify_domain: credential?.shopify_domain ?? legacy?.shopify_domain ?? null,
      connected: hasCiphertext && hasIv,
      last_validated_at: credential?.last_validated_at ?? null,
    };
  });

  return jsonResponse({ connections });
});

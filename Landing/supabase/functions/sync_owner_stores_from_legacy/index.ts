import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';
import { normalizeDomainInput, normalizeShopifyDomainInput } from '../_shared/store-access.ts';

type LegacyStoreUserRow = {
  domain: string;
  shopify_domain: string | null;
  role: string;
  status: string;
};

type LegacyShopRow = {
  shopify_domain: string;
  allowed_domains: string[] | null;
};

type CandidateStore = {
  domain: string;
  shopifyDomain: string | null;
  source: 'legacy_store_users' | 'legacy_shops';
};

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;
    const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
    return atob(padded);
  } catch {
    return null;
  }
}

function extractEmailFromAuthorizationHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) {
    return null;
  }

  const [, payloadPart] = token.split('.');
  if (!payloadPart) {
    return null;
  }

  const decodedPayload = decodeBase64Url(payloadPart);
  if (!decodedPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodedPayload) as { email?: unknown };
    const email = asString(parsed.email);
    return email ? email.toLowerCase() : null;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asOptionalString(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  return asString(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item): item is string => !!item)
    .map((item) => normalizeDomainInput(item));
}

function parseLegacyStoreUserRow(raw: unknown): LegacyStoreUserRow | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }

  const domain = asString(row['domain']);
  const role = asString(row['role']);
  const status = asString(row['status']);

  if (!domain || !role || !status) {
    return null;
  }

  const shopifyDomain = asOptionalString(row['shopify_domain']);

  return {
    domain: normalizeDomainInput(domain),
    shopify_domain: shopifyDomain ? normalizeShopifyDomainInput(shopifyDomain) : null,
    role,
    status,
  };
}

function parseLegacyShopRow(raw: unknown): LegacyShopRow | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }

  const shopifyDomain = asString(row['shopify_domain']);
  if (!shopifyDomain) {
    return null;
  }

  return {
    shopify_domain: normalizeShopifyDomainInput(shopifyDomain),
    allowed_domains: asStringArray(row['allowed_domains']),
  };
}

function deriveDomainFromShopifyDomain(shopifyDomain: string): string {
  return normalizeDomainInput(shopifyDomain.replace(/\.myshopify\.com$/, ''));
}

function resolveDomainFromLegacyShop(row: LegacyShopRow): string {
  const allowedDomains = row.allowed_domains ?? [];

  const preferred = allowedDomains.find((domain) => !domain.endsWith('.myshopify.com'));
  if (preferred) {
    return preferred;
  }

  if (allowedDomains.length > 0) {
    return allowedDomains[0];
  }

  return deriveDomainFromShopifyDomain(row.shopify_domain);
}

function buildStoreName(domain: string): string {
  return domain;
}

async function ensureUserLicense(supabaseAdmin: ReturnType<typeof getServiceClient>, email: string) {
  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from('users')
    .select('license_id')
    .eq('email', email)
    .maybeSingle();

  if (existingUserError) {
    throw new Error(existingUserError.message || 'Failed to load user profile');
  }

  if (existingUser?.license_id) {
    return existingUser.license_id as string;
  }

  const { data: license, error: licenseError } = await supabaseAdmin
    .from('licenses')
    .insert({ tier: 'starter' })
    .select('license_id')
    .single();

  if (licenseError || !license) {
    throw new Error(licenseError?.message || 'Failed to create starter license');
  }

  const { error: userUpsertError } = await supabaseAdmin
    .from('users')
    .upsert({
      email,
      license_id: license.license_id,
      name: '',
      lastname: '',
    });

  if (userUpsertError) {
    throw new Error(userUpsertError.message || 'Failed to save user profile');
  }

  return license.license_id as string;
}

async function getCandidatesFromLegacyStoreUsers(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  email: string
): Promise<CandidateStore[]> {
  const { data, error } = await supabaseAdmin
    .from('v_legacy_store_users')
    .select('domain, shopify_domain, role, status')
    .eq('email', email)
    .eq('role', 'owner')
    .eq('status', 'active');

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => parseLegacyStoreUserRow(row))
    .filter((row): row is LegacyStoreUserRow => !!row)
    .map((row) => ({
      domain: row.domain,
      shopifyDomain: row.shopify_domain,
      source: 'legacy_store_users' as const,
    }));
}

async function getCandidatesFromLegacyShops(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  email: string
): Promise<CandidateStore[]> {
  const { data, error } = await supabaseAdmin
    .from('shops')
    .select('shopify_domain, allowed_domains')
    .eq('owner_email', email);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => parseLegacyShopRow(row))
    .filter((row): row is LegacyShopRow => !!row)
    .map((row) => ({
      domain: resolveDomainFromLegacyShop(row),
      shopifyDomain: row.shopify_domain,
      source: 'legacy_shops' as const,
    }));
}

function dedupeCandidates(candidates: CandidateStore[]): CandidateStore[] {
  const byDomain = new Map<string, CandidateStore>();

  for (const candidate of candidates) {
    if (!candidate.domain) {
      continue;
    }

    const key = normalizeDomainInput(candidate.domain);

    if (!byDomain.has(key)) {
      byDomain.set(key, {
        ...candidate,
        domain: key,
      });
      continue;
    }

    const existing = byDomain.get(key)!;
    if (!existing.shopifyDomain && candidate.shopifyDomain) {
      byDomain.set(key, {
        ...existing,
        shopifyDomain: candidate.shopifyDomain,
      });
    }
  }

  return Array.from(byDomain.values());
}

async function upsertOwnerStore(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  email: string,
  candidate: CandidateStore
) {
  const { error: storeError } = await supabaseAdmin.from('stores').upsert(
    {
      domain: candidate.domain,
      name: buildStoreName(candidate.domain),
      owner_id: email,
    },
    { onConflict: 'domain' }
  );

  if (storeError) {
    throw new Error(storeError.message || `Failed to upsert store ${candidate.domain}`);
  }

  const { error: storeUserError } = await supabaseAdmin.from('store_users').upsert(
    {
      domain: candidate.domain,
      email,
      invited_by: null,
      role: 'owner',
      status: 'active',
    },
    { onConflict: 'domain,email' }
  );

  if (storeUserError) {
    throw new Error(storeUserError.message || `Failed to upsert store user for ${candidate.domain}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const user = await getUser(req);
  const emailFromUser = user?.email?.trim().toLowerCase() ?? null;
  const emailFromJwt = extractEmailFromAuthorizationHeader(req.headers.get('Authorization'));
  const email = emailFromUser ?? emailFromJwt;

  if (!email) {
    return errorResponse(401, 'Unauthorized', 'MISSING_AUTH_EMAIL');
  }

  const supabaseAdmin = getServiceClient();

  try {
    await ensureUserLicense(supabaseAdmin, email);

    const [fromLegacyUsers, fromLegacyShops] = await Promise.all([
      getCandidatesFromLegacyStoreUsers(supabaseAdmin, email),
      getCandidatesFromLegacyShops(supabaseAdmin, email),
    ]);

    const candidates = dedupeCandidates([...fromLegacyUsers, ...fromLegacyShops]);

    for (const candidate of candidates) {
      await upsertOwnerStore(supabaseAdmin, email, candidate);
    }

    return jsonResponse({
      synced: candidates.length,
      stores: candidates.map((candidate) => ({
        domain: candidate.domain,
        shopify_domain: candidate.shopifyDomain,
        source: candidate.source,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected sync error';
    return errorResponse(500, message);
  }
});

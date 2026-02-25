import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';
import { normalizeDomainInput, normalizeShopifyDomainInput } from '../_shared/store-access.ts';
import { decryptShopifyToken, encryptShopifyToken } from '../_shared/shopify-token-crypto.ts';

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

type LegacyShopCredentialRow = {
  shopifyDomain: string;
  accessToken: string | null;
  accessTokenCiphertext: string | null;
  accessTokenIv: string | null;
};

const SHOPIFY_API_VERSION = Deno.env.get('SHOPIFY_API_VERSION') ?? '2024-10';

const LEGACY_ACCESS_TOKEN_KEYS = [
  'access_token',
  'accessToken',
  'admin_access_token',
  'adminAccessToken',
  'shopify_access_token',
  'shopifyAccessToken',
  'token',
  'shop_token',
  'shopToken',
];

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

function parseLegacyShopCredentialRow(raw: unknown): LegacyShopCredentialRow | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }

  const shopifyDomainRaw = asString(row['shopify_domain']);
  if (!shopifyDomainRaw) {
    return null;
  }

  let accessToken: string | null = null;

  for (const key of LEGACY_ACCESS_TOKEN_KEYS) {
    const candidate = asOptionalString(row[key]);
    if (candidate) {
      accessToken = candidate;
      break;
    }
  }

  const accessTokenCiphertext = asOptionalString(row['access_token_ciphertext']);
  const accessTokenIv = asOptionalString(row['access_token_iv']);

  return {
    shopifyDomain: normalizeShopifyDomainInput(shopifyDomainRaw),
    accessToken,
    accessTokenCiphertext,
    accessTokenIv,
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

async function shopifyGraphQL(
  shopifyDomain: string,
  accessToken: string,
  query: string,
  variables?: unknown
) {
  const url = `https://${shopifyDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const bodyText = await resp.text();

  if (!resp.ok) {
    return { ok: false as const, status: resp.status, body: bodyText };
  }

  try {
    const json = JSON.parse(bodyText);
    return { ok: true as const, json };
  } catch {
    return { ok: false as const, status: 500, body: bodyText };
  }
}

async function validateCredentials(shopifyDomain: string, accessToken: string): Promise<boolean> {
  const query = `query ValidateToken($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id
    }
  }`;

  const variables = {
    handle: {
      type: 'kustomizer_probe',
      handle: 'kustomizer-probe',
    },
  };

  const resp = await shopifyGraphQL(shopifyDomain, accessToken, query, variables);

  if (!resp.ok) {
    return false;
  }

  if (resp.json?.errors?.length) {
    return false;
  }

  return true;
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

async function getLegacyShopCredential(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  shopifyDomain: string
): Promise<LegacyShopCredentialRow | null> {
  const normalizedShopifyDomain = normalizeShopifyDomainInput(shopifyDomain);

  const { data, error } = await supabaseAdmin
    .from('shop_credentials')
    .select('*')
    .eq('shopify_domain', normalizedShopifyDomain)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const parsed = parseLegacyShopCredentialRow(data);
  if (!parsed) {
    return null;
  }

  return parsed;
}

async function resolveValidLegacyAccessToken(
  legacyCredential: LegacyShopCredentialRow
): Promise<string | null> {
  const candidateTokens: string[] = [];

  if (legacyCredential.accessToken) {
    candidateTokens.push(legacyCredential.accessToken);
  }

  if (legacyCredential.accessTokenCiphertext && legacyCredential.accessTokenIv) {
    try {
      const decrypted = await decryptShopifyToken(
        legacyCredential.accessTokenCiphertext,
        legacyCredential.accessTokenIv
      );
      if (decrypted.token) {
        candidateTokens.push(decrypted.token);
      }
    } catch {
      // Keep sync resilient when legacy encrypted tokens use an unknown key.
    }
  }

  const uniqueTokens = [...new Set(candidateTokens)];

  for (const token of uniqueTokens) {
    const valid = await validateCredentials(legacyCredential.shopifyDomain, token);
    if (valid) {
      return token;
    }
  }

  return null;
}

async function upsertShopifyCredentialsFromLegacy(
  supabaseAdmin: ReturnType<typeof getServiceClient>,
  domain: string,
  shopifyDomain: string
): Promise<boolean> {
  const legacyCredential = await getLegacyShopCredential(supabaseAdmin, shopifyDomain);

  if (!legacyCredential) {
    return false;
  }

  const now = new Date().toISOString();

  const validAccessToken = await resolveValidLegacyAccessToken(legacyCredential);
  if (!validAccessToken) {
    return false;
  }

  const encrypted = await encryptShopifyToken(validAccessToken);

  const { error } = await supabaseAdmin.from('store_shopify_credentials').upsert(
    {
      domain: normalizeDomainInput(domain),
      shopify_domain: legacyCredential.shopifyDomain,
      access_token_ciphertext: encrypted.ciphertextB64,
      access_token_iv: encrypted.ivB64,
      updated_at: now,
      last_validated_at: now,
    },
    { onConflict: 'domain' }
  );

  if (error) {
    throw new Error(error.message || `Failed to sync Shopify credentials for ${domain}`);
  }

  return true;
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
  const email = user?.email?.trim().toLowerCase() ?? null;

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
    let credentialsSynced = 0;

    for (const candidate of candidates) {
      await upsertOwnerStore(supabaseAdmin, email, candidate);

      if (!candidate.shopifyDomain) {
        continue;
      }

      try {
        const synced = await upsertShopifyCredentialsFromLegacy(
          supabaseAdmin,
          candidate.domain,
          candidate.shopifyDomain
        );
        if (synced) {
          credentialsSynced += 1;
        }
      } catch {
        // Keep store ownership sync resilient even when credentials cannot be imported.
      }
    }

    return jsonResponse({
      synced: candidates.length,
      credentials_synced: credentialsSynced,
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

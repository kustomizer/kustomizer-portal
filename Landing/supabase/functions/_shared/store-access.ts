type QueryResult = {
  data: unknown;
  error: unknown;
};

type SupabaseQueryBuilder = {
  select(columns: string): SupabaseQueryBuilder;
  eq(column: string, value: string): SupabaseQueryBuilder;
  maybeSingle(): Promise<QueryResult>;
};

type SupabaseAdminClient = {
  from(table: string): SupabaseQueryBuilder;
};

type StoreUserRow = {
  domain: string;
  email: string;
  invited_by: string | null;
  role: string;
  status: string;
};

type LegacyStoreUserRow = StoreUserRow & {
  shopify_domain: string | null;
};

type LegacyStoreRow = {
  domain: string;
  shopify_domain: string | null;
};

type ShopifyCredentialMappingRow = {
  domain: string;
  shopify_domain: string;
};

export type ResolvedStoreMembership = {
  requestedDomain: string;
  requestedEmail: string;
  canonicalDomain: string;
  shopifyDomain: string | null;
  storeUser: StoreUserRow;
};

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

function stripUrlProtocol(host: string): string {
  return host.replace(/^[a-z]+:\/\//i, '');
}

function stripPathAndQuery(host: string): string {
  return host.split('/')[0].split('?')[0].split('#')[0];
}

function stripPort(host: string): string {
  return host.split(':')[0];
}

export function normalizeShopifyDomainInput(value: string): string {
  let normalized = value.trim().toLowerCase();

  while (normalized.endsWith('.myshopify.com.myshopify.com')) {
    normalized = normalized.replace(/\.myshopify\.com\.myshopify\.com$/, '.myshopify.com');
  }

  return normalized;
}

export function normalizeDomainInput(value: string): string {
  const withoutProtocol = stripUrlProtocol(value.trim().toLowerCase());
  const withoutPath = stripPathAndQuery(withoutProtocol);
  const withoutPort = stripPort(withoutPath);
  const withoutTrailingDot = withoutPort.replace(/\.$/, '');

  return normalizeShopifyDomainInput(withoutTrailingDot);
}

export function normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase();
}

function parseStoreUserRow(raw: unknown): StoreUserRow | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }

  const domain = asString(row['domain']);
  const email = asString(row['email']);
  const role = asString(row['role']);
  const status = asString(row['status']);

  if (!domain || !email || !role || !status) {
    return null;
  }

  return {
    domain: normalizeDomainInput(domain),
    email: normalizeEmailInput(email),
    invited_by: asOptionalString(row['invited_by']),
    role,
    status,
  };
}

function parseLegacyStoreUserRow(raw: unknown): LegacyStoreUserRow | null {
  const base = parseStoreUserRow(raw);
  const row = asRecord(raw);

  if (!base || !row) {
    return null;
  }

  const shopifyDomain = asOptionalString(row['shopify_domain']);

  return {
    ...base,
    shopify_domain: shopifyDomain ? normalizeShopifyDomainInput(shopifyDomain) : null,
  };
}

function parseLegacyStoreRow(raw: unknown): LegacyStoreRow | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }

  const domain = asString(row['domain']);
  if (!domain) {
    return null;
  }

  const shopifyDomain = asOptionalString(row['shopify_domain']);

  return {
    domain: normalizeDomainInput(domain),
    shopify_domain: shopifyDomain ? normalizeShopifyDomainInput(shopifyDomain) : null,
  };
}

function parseCredentialMappingRow(raw: unknown): ShopifyCredentialMappingRow | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }

  const domain = asString(row['domain']);
  const shopifyDomain = asString(row['shopify_domain']);

  if (!domain || !shopifyDomain) {
    return null;
  }

  return {
    domain: normalizeDomainInput(domain),
    shopify_domain: normalizeShopifyDomainInput(shopifyDomain),
  };
}

async function findLegacyStoreUser(
  supabaseAdmin: SupabaseAdminClient,
  column: 'domain' | 'shopify_domain',
  domain: string,
  email: string
): Promise<LegacyStoreUserRow | null> {
  const { data, error } = await supabaseAdmin
    .from('v_legacy_store_users')
    .select('domain, shopify_domain, email, invited_by, role, status')
    .eq(column, domain)
    .eq('email', email)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseLegacyStoreUserRow(data);
}

async function findStoreUser(
  supabaseAdmin: SupabaseAdminClient,
  domain: string,
  email: string
): Promise<StoreUserRow | null> {
  const { data, error } = await supabaseAdmin
    .from('store_users')
    .select('domain, email, invited_by, role, status')
    .eq('domain', domain)
    .eq('email', email)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseStoreUserRow(data);
}

async function findLegacyStore(
  supabaseAdmin: SupabaseAdminClient,
  column: 'domain' | 'shopify_domain',
  domain: string
): Promise<LegacyStoreRow | null> {
  const { data, error } = await supabaseAdmin
    .from('v_legacy_stores')
    .select('domain, shopify_domain')
    .eq(column, domain)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseLegacyStoreRow(data);
}

async function findCredentialMappingByShopifyDomain(
  supabaseAdmin: SupabaseAdminClient,
  shopifyDomain: string
): Promise<ShopifyCredentialMappingRow | null> {
  const { data, error } = await supabaseAdmin
    .from('store_shopify_credentials')
    .select('domain, shopify_domain')
    .eq('shopify_domain', shopifyDomain)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseCredentialMappingRow(data);
}

function toResolvedMembership(
  requestedDomain: string,
  requestedEmail: string,
  storeUser: StoreUserRow,
  shopifyDomain: string | null
): ResolvedStoreMembership {
  return {
    requestedDomain,
    requestedEmail,
    canonicalDomain: normalizeDomainInput(storeUser.domain),
    shopifyDomain,
    storeUser,
  };
}

export async function resolveStoreMembership(
  supabaseAdmin: SupabaseAdminClient,
  rawDomain: string,
  rawEmail: string
): Promise<ResolvedStoreMembership | null> {
  const requestedDomain = normalizeDomainInput(rawDomain);
  const requestedEmail = normalizeEmailInput(rawEmail);

  if (!requestedDomain || !requestedEmail) {
    return null;
  }

  const normalizedShopifyDomain = normalizeShopifyDomainInput(requestedDomain);

  const legacyByDomain = await findLegacyStoreUser(
    supabaseAdmin,
    'domain',
    requestedDomain,
    requestedEmail
  );

  if (legacyByDomain) {
    return toResolvedMembership(
      requestedDomain,
      requestedEmail,
      legacyByDomain,
      legacyByDomain.shopify_domain
    );
  }

  const legacyByShopifyDomain = await findLegacyStoreUser(
    supabaseAdmin,
    'shopify_domain',
    normalizedShopifyDomain,
    requestedEmail
  );

  if (legacyByShopifyDomain) {
    return toResolvedMembership(
      requestedDomain,
      requestedEmail,
      legacyByShopifyDomain,
      legacyByShopifyDomain.shopify_domain
    );
  }

  const legacyStoreByShopify = await findLegacyStore(
    supabaseAdmin,
    'shopify_domain',
    normalizedShopifyDomain
  );

  if (legacyStoreByShopify) {
    const storeUser = await findStoreUser(
      supabaseAdmin,
      normalizeDomainInput(legacyStoreByShopify.domain),
      requestedEmail
    );

    if (storeUser) {
      return toResolvedMembership(
        requestedDomain,
        requestedEmail,
        storeUser,
        legacyStoreByShopify.shopify_domain
      );
    }
  }

  const legacyStoreByDomain = await findLegacyStore(supabaseAdmin, 'domain', requestedDomain);

  if (legacyStoreByDomain) {
    const storeUser = await findStoreUser(
      supabaseAdmin,
      normalizeDomainInput(legacyStoreByDomain.domain),
      requestedEmail
    );

    if (storeUser) {
      return toResolvedMembership(
        requestedDomain,
        requestedEmail,
        storeUser,
        legacyStoreByDomain.shopify_domain
      );
    }
  }

  const mappedByCredentials = await findCredentialMappingByShopifyDomain(
    supabaseAdmin,
    normalizedShopifyDomain
  );

  if (mappedByCredentials) {
    const storeUser = await findStoreUser(
      supabaseAdmin,
      normalizeDomainInput(mappedByCredentials.domain),
      requestedEmail
    );

    if (storeUser) {
      return toResolvedMembership(
        requestedDomain,
        requestedEmail,
        storeUser,
        mappedByCredentials.shopify_domain
      );
    }
  }

  const directStoreUser = await findStoreUser(supabaseAdmin, requestedDomain, requestedEmail);

  if (directStoreUser) {
    return toResolvedMembership(requestedDomain, requestedEmail, directStoreUser, null);
  }

  return null;
}

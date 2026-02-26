type QueryResult = {
  data: unknown;
  error: unknown;
};

type SupabaseQueryBuilder = {
  select(columns: string): SupabaseQueryBuilder;
  eq(column: string, value: string): SupabaseQueryBuilder;
  contains(column: string, value: string[]): SupabaseQueryBuilder;
  maybeSingle(): Promise<QueryResult>;
};

type SupabaseAdminClient = {
  from(table: string): SupabaseQueryBuilder;
};

type ShopUserRow = {
  shop_id: string;
  email: string;
  invited_by: string | null;
  role: string;
  status: string;
};

type ShopRow = {
  id: string;
  shopify_domain: string;
  owner_email: string;
};

export type ResolvedStoreMembership = {
  requestedDomain: string;
  requestedEmail: string;
  shopId: string;
  shopifyDomain: string;
  ownerEmail: string;
  shopUser: ShopUserRow;
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

function parseShopUserRow(raw: unknown): ShopUserRow | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }

  const shopId = asString(row['shop_id']);
  const email = asString(row['email']);
  const role = asString(row['role']);
  const status = asString(row['status']);

  if (!shopId || !email || !role || !status) {
    return null;
  }

  return {
    shop_id: shopId,
    email: normalizeEmailInput(email),
    invited_by: asOptionalString(row['invited_by']),
    role,
    status,
  };
}

function parseShopRow(raw: unknown): ShopRow | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }

  const id = asString(row['id']);
  const shopifyDomain = asString(row['shopify_domain']);
  const ownerEmail = asString(row['owner_email']);

  if (!id || !shopifyDomain || !ownerEmail) {
    return null;
  }

  return {
    id,
    shopify_domain: normalizeShopifyDomainInput(shopifyDomain),
    owner_email: normalizeEmailInput(ownerEmail),
  };
}

async function findShopByDomain(
  supabaseAdmin: SupabaseAdminClient,
  requestedDomain: string
): Promise<ShopRow | null> {
  const normalized = normalizeDomainInput(requestedDomain);

  const { data: byShopifyDomain, error: byShopifyDomainError } = await supabaseAdmin
    .from('shops')
    .select('id, shopify_domain, owner_email')
    .eq('shopify_domain', normalized)
    .maybeSingle();

  if (!byShopifyDomainError && byShopifyDomain) {
    return parseShopRow(byShopifyDomain);
  }

  const { data: byAllowedDomain, error: byAllowedDomainError } = await supabaseAdmin
    .from('shops')
    .select('id, shopify_domain, owner_email')
    .contains('allowed_domains', [normalized])
    .maybeSingle();

  if (byAllowedDomainError || !byAllowedDomain) {
    return null;
  }

  return parseShopRow(byAllowedDomain);
}

async function findShopUser(
  supabaseAdmin: SupabaseAdminClient,
  shopId: string,
  email: string
): Promise<ShopUserRow | null> {
  const { data, error } = await supabaseAdmin
    .from('shop_users')
    .select('shop_id, email, invited_by, role, status')
    .eq('shop_id', shopId)
    .eq('email', normalizeEmailInput(email))
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parseShopUserRow(data);
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

  const shop = await findShopByDomain(supabaseAdmin, requestedDomain);
  if (!shop) {
    return null;
  }

  const shopUser = await findShopUser(supabaseAdmin, shop.id, requestedEmail);
  if (!shopUser) {
    return null;
  }

  return {
    requestedDomain,
    requestedEmail,
    shopId: shop.id,
    shopifyDomain: shop.shopify_domain,
    ownerEmail: shop.owner_email,
    shopUser,
  };
}

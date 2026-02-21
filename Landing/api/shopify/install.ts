const DEFAULT_SHOPIFY_INSTALL_FALLBACK_URL =
  'https://admin.shopify.com/?organization_id=185071352&no_redirect=true&redirect=/oauth/redirect_from_developer_dashboard?client_id%3D95606a5f4f3c52b279cca5d8e090d1eb';

function normalizeShopDomain(raw: string): string | null {
  let normalized = raw.trim().toLowerCase();
  normalized = normalized.replace(/^[a-z]+:\/\//i, '');
  normalized = normalized.split('/')[0].split('?')[0].split('#')[0].split(':')[0];

  if (!normalized) {
    return null;
  }

  if (!normalized.endsWith('.myshopify.com')) {
    normalized = `${normalized}.myshopify.com`;
  }

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function getFallbackInstallUrl(): string {
  const configured = process.env['SHOPIFY_INSTALL_FALLBACK_URL']?.trim();
  if (!configured) {
    return DEFAULT_SHOPIFY_INSTALL_FALLBACK_URL;
  }

  try {
    const parsed = new URL(configured);
    return parsed.protocol === 'https:' ? parsed.toString() : DEFAULT_SHOPIFY_INSTALL_FALLBACK_URL;
  } catch {
    return DEFAULT_SHOPIFY_INSTALL_FALLBACK_URL;
  }
}

function getOAuthInstallConfig(): { clientId: string; scopes: string; redirectUri: string } | null {
  const clientId = process.env['SHOPIFY_APP_CLIENT_ID']?.trim();
  const scopes = process.env['SHOPIFY_APP_SCOPES']?.trim();
  const redirectUri = process.env['SHOPIFY_OAUTH_REDIRECT_URI']?.trim();

  if (!clientId || !scopes || !redirectUri) {
    return null;
  }

  return {
    clientId,
    scopes,
    redirectUri,
  };
}

function buildOAuthInstallUrl(
  shop: string,
  config: { clientId: string; scopes: string; redirectUri: string },
  state: string
): string {
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('scope', config.scopes);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('state', state);
  return url.toString();
}

function randomState(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function redirect(res: any, location: string): void {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

function json(res: any, statusCode: number, payload: Record<string, unknown>): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default function handler(req: any, res: any): void {
  const fallbackInstallUrl = getFallbackInstallUrl();
  const rawShop = typeof req.query?.shop === 'string' ? req.query.shop : null;

  if (!rawShop) {
    redirect(res, fallbackInstallUrl);
    return;
  }

  const shop = normalizeShopDomain(rawShop);
  if (!shop) {
    json(res, 400, { message: 'Invalid shop parameter' });
    return;
  }

  const oauthConfig = getOAuthInstallConfig();
  if (!oauthConfig) {
    redirect(res, fallbackInstallUrl);
    return;
  }

  const state = randomState();
  res.setHeader(
    'Set-Cookie',
    `shopify_oauth_state=${state}; Max-Age=600; Path=/; HttpOnly; SameSite=Lax; Secure`
  );

  redirect(res, buildOAuthInstallUrl(shop, oauthConfig, state));
}

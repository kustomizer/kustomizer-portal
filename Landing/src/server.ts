import 'reflect-metadata';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import crypto from 'node:crypto';
import express, { type Request, type Response } from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const DEFAULT_SHOPIFY_INSTALL_FALLBACK_URL =
  'https://admin.shopify.com/?organization_id=185071352&no_redirect=true&redirect=/oauth/redirect_from_developer_dashboard?client_id%3D95606a5f4f3c52b279cca5d8e090d1eb';

function getQueryStringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return null;
}

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

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, chunk) => {
    const [name, ...valueParts] = chunk.trim().split('=');
    if (!name) {
      return acc;
    }

    const rawValue = valueParts.join('=');
    try {
      acc[name] = decodeURIComponent(rawValue);
    } catch {
      acc[name] = rawValue;
    }
    return acc;
  }, {});
}

function safeCompare(left: string | null, right: string | null): boolean {
  if (!left || !right) {
    return false;
  }

  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function buildOAuthHmacMessage(rawUrl: string): string {
  const parsed = new URL(rawUrl, 'https://placeholder.local');
  const pairs: Array<[string, string]> = [];

  for (const [key, value] of parsed.searchParams.entries()) {
    if (key === 'hmac' || key === 'signature') {
      continue;
    }

    pairs.push([key, value]);
  }

  pairs.sort((a, b) => {
    if (a[0] === b[0]) {
      return a[1].localeCompare(b[1]);
    }
    return a[0].localeCompare(b[0]);
  });

  return pairs.map(([key, value]) => `${key}=${value}`).join('&');
}

function verifyOAuthHmac(rawUrl: string, providedHmac: string, clientSecret: string): boolean {
  const message = buildOAuthHmacMessage(rawUrl);
  const expected = crypto.createHmac('sha256', clientSecret).update(message).digest('hex');
  return safeCompare(expected, providedHmac.toLowerCase());
}

function getOAuthCallbackConfig(): {
  clientId: string;
  clientSecret: string;
  supabaseUrl: string;
  finalizeSecret: string;
} | null {
  const clientId = process.env['SHOPIFY_APP_CLIENT_ID']?.trim();
  const clientSecret =
    process.env['SHOPIFY_APP_CLIENT_SECRET']?.trim() ?? process.env['SHOPIFY_API_SECRET']?.trim();
  const supabaseUrl = process.env['SUPABASE_URL']?.trim();
  const finalizeSecret = process.env['SHOPIFY_OAUTH_FINALIZE_SECRET']?.trim();

  if (!clientId || !clientSecret || !supabaseUrl || !finalizeSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    finalizeSecret,
  };
}

function getSingleHeaderValue(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return null;
}

function getPortalRedirectBase(req: Request): string {
  const configured = process.env['SHOPIFY_OAUTH_PORTAL_REDIRECT_URL']?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.toString();
      }
    } catch {
      // Fall through to request-derived default.
    }
  }

  const forwardedProto = getSingleHeaderValue(req.headers['x-forwarded-proto']);
  const forwardedHost = getSingleHeaderValue(req.headers['x-forwarded-host']);
  const host = forwardedHost ?? req.get('host') ?? 'localhost:4200';
  const protocol = forwardedProto ?? req.protocol ?? 'https';

  return `${protocol}://${host}/app/stores`;
}

function buildPortalRedirect(
  req: Request,
  params: Record<string, string | null | undefined>
): string {
  const url = new URL(getPortalRedirectBase(req));
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function clearStateCookie(res: Response): void {
  res.cookie('shopify_oauth_state', '', {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

async function exchangeAccessToken(
  shop: string,
  code: string,
  config: { clientId: string; clientSecret: string }
): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
  });

  const bodyText = await response.text();

  let body: unknown = null;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: `TOKEN_EXCHANGE_HTTP_${response.status}` };
  }

  const record = body as { access_token?: unknown } | null;
  const accessToken = typeof record?.access_token === 'string' ? record.access_token.trim() : '';

  if (!accessToken) {
    return { ok: false, error: 'TOKEN_EXCHANGE_MISSING_ACCESS_TOKEN' };
  }

  return { ok: true, accessToken };
}

async function finalizeOauth(
  shop: string,
  accessToken: string,
  config: { supabaseUrl: string; finalizeSecret: string }
): Promise<{ ok: true; domain: string | null } | { ok: false; error: string }> {
  const endpoint = `${config.supabaseUrl}/functions/v1/shopify_oauth_finalize`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-oauth-finalize-secret': config.finalizeSecret,
    },
    body: JSON.stringify({
      shopify_domain: shop,
      access_token: accessToken,
    }),
  });

  const bodyText = await response.text();
  let body: unknown = null;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }

  const parsed = body as { reason?: unknown; domain?: unknown } | null;

  if (!response.ok) {
    return {
      ok: false,
      error: typeof parsed?.reason === 'string' ? parsed.reason : `FINALIZE_HTTP_${response.status}`,
    };
  }

  return {
    ok: true,
    domain: typeof parsed?.domain === 'string' ? parsed.domain : null,
  };
}

const app = express();
const angularApp = new AngularNodeAppEngine();

app.get('/api/shopify/install', (req, res) => {
  const fallbackInstallUrl = getFallbackInstallUrl();

  const rawShop = getQueryStringValue(req.query['shop']);
  if (!rawShop) {
    res.redirect(302, fallbackInstallUrl);
    return;
  }

  const shop = normalizeShopDomain(rawShop);
  if (!shop) {
    res.status(400).json({ message: 'Invalid shop parameter' });
    return;
  }

  const oauthConfig = getOAuthInstallConfig();
  if (!oauthConfig) {
    res.redirect(302, fallbackInstallUrl);
    return;
  }

  const state = crypto.randomUUID();
  res.cookie('shopify_oauth_state', state, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
  });

  res.redirect(302, buildOAuthInstallUrl(shop, oauthConfig, state));
});

app.get('/api/shopify/callback', async (req, res) => {
  const callbackConfig = getOAuthCallbackConfig();
  if (!callbackConfig) {
    res.redirect(302, buildPortalRedirect(req, { shopify: 'error', reason: 'MISSING_OAUTH_CONFIG' }));
    return;
  }

  const rawShop = getQueryStringValue(req.query['shop']);
  const code = getQueryStringValue(req.query['code']);
  const state = getQueryStringValue(req.query['state']);
  const hmac = getQueryStringValue(req.query['hmac']);

  const shop = rawShop ? normalizeShopDomain(rawShop) : null;
  if (!shop || !code || !state || !hmac) {
    clearStateCookie(res);
    res.redirect(302, buildPortalRedirect(req, { shopify: 'error', reason: 'INVALID_CALLBACK_PARAMS' }));
    return;
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  const stateFromCookie = cookies['shopify_oauth_state'] ?? null;

  if (!safeCompare(stateFromCookie, state)) {
    clearStateCookie(res);
    res.redirect(302, buildPortalRedirect(req, { shopify: 'error', reason: 'STATE_MISMATCH' }));
    return;
  }

  if (!verifyOAuthHmac(req.originalUrl, hmac, callbackConfig.clientSecret)) {
    clearStateCookie(res);
    res.redirect(302, buildPortalRedirect(req, { shopify: 'error', reason: 'INVALID_HMAC' }));
    return;
  }

  try {
    const exchanged = await exchangeAccessToken(shop, code, callbackConfig);
    if (!exchanged.ok) {
      clearStateCookie(res);
      res.redirect(302, buildPortalRedirect(req, { shopify: 'error', reason: exchanged.error, shop }));
      return;
    }

    const finalized = await finalizeOauth(shop, exchanged.accessToken, callbackConfig);
    if (!finalized.ok) {
      clearStateCookie(res);
      res.redirect(302, buildPortalRedirect(req, { shopify: 'error', reason: finalized.error, shop }));
      return;
    }

    clearStateCookie(res);
    res.redirect(
      302,
      buildPortalRedirect(req, {
        shopify: 'connected',
        shop,
        domain: finalized.domain,
      })
    );
  } catch (error) {
    console.error('shopify-callback-route-error', error);
    clearStateCookie(res);
    res.redirect(302, buildPortalRedirect(req, { shopify: 'error', reason: 'UNEXPECTED_CALLBACK_ERROR' }));
  }
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);

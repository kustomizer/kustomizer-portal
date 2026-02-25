const crypto = require('node:crypto');

const DEFAULT_SHOPIFY_INSTALL_FALLBACK_URL =
  'https://admin.shopify.com/?organization_id=185071352&no_redirect=true&redirect=/oauth/redirect_from_developer_dashboard?client_id%3D95606a5f4f3c52b279cca5d8e090d1eb';

function normalizeShopDomain(raw) {
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

function getFallbackInstallUrl() {
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

function getOAuthInstallConfig() {
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

function buildOAuthInstallUrl(shop, config, state) {
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('scope', config.scopes);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('state', state);
  return url.toString();
}

function randomState() {
  return crypto.randomUUID();
}

function getShopQueryParam(req) {
  const queryShop = req?.query?.shop;

  if (typeof queryShop === 'string') {
    return queryShop;
  }

  if (Array.isArray(queryShop) && typeof queryShop[0] === 'string') {
    return queryShop[0];
  }

  if (typeof req?.url === 'string') {
    try {
      const parsed = new URL(req.url, 'https://placeholder.local');
      return parsed.searchParams.get('shop');
    } catch {
      return null;
    }
  }

  return null;
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function handler(req, res) {
  try {
    const fallbackInstallUrl = getFallbackInstallUrl();
    const rawShop = getShopQueryParam(req);

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
  } catch (error) {
    console.error('shopify-install-function-error', error);
    json(res, 500, { message: 'Unexpected install error' });
  }
}

module.exports = handler;
module.exports.config = {
  runtime: 'nodejs',
};

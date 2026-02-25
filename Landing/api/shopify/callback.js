const crypto = require('node:crypto');

function asSingleQueryValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return null;
}

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

function parseCookies(cookieHeader) {
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) {
    return {};
  }

  return cookieHeader.split(';').reduce((acc, chunk) => {
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

function safeCompare(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }

  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function buildOAuthHmacMessage(reqUrl) {
  const parsed = new URL(reqUrl ?? '', 'https://placeholder.local');
  const pairs = [];

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

function verifyOAuthHmac(reqUrl, providedHmac, clientSecret) {
  if (!providedHmac || !clientSecret) {
    return false;
  }

  const message = buildOAuthHmacMessage(reqUrl);
  const expected = crypto.createHmac('sha256', clientSecret).update(message).digest('hex');

  return safeCompare(expected, String(providedHmac).toLowerCase());
}

function getCallbackConfig() {
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

function getPortalRedirectBase(req) {
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

  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : 'https';
  const forwardedHost = req?.headers?.['x-forwarded-host'];
  const hostHeader =
    typeof forwardedHost === 'string'
      ? forwardedHost.split(',')[0].trim()
      : typeof req?.headers?.host === 'string'
        ? req.headers.host
        : 'kustomizer.net';

  return `${protocol}://${hostHeader}/app/stores`;
}

function buildPortalRedirect(req, params) {
  const url = new URL(getPortalRedirectBase(req));
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function setExpiredStateCookie(res) {
  res.setHeader(
    'Set-Cookie',
    'shopify_oauth_state=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure'
  );
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

async function exchangeAccessToken(shop, code, config) {
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

  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: `TOKEN_EXCHANGE_HTTP_${response.status}` };
  }

  const accessToken = typeof body?.access_token === 'string' ? body.access_token.trim() : '';
  if (!accessToken) {
    return { ok: false, error: 'TOKEN_EXCHANGE_MISSING_ACCESS_TOKEN' };
  }

  return {
    ok: true,
    accessToken,
  };
}

async function finalizeOauth(shop, accessToken, config) {
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
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: typeof body?.reason === 'string' ? body.reason : `FINALIZE_HTTP_${response.status}`,
    };
  }

  return {
    ok: true,
    domain: typeof body?.domain === 'string' ? body.domain : null,
  };
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ message: 'Method not allowed' }));
    return;
  }

  const config = getCallbackConfig();
  if (!config) {
    redirect(res, buildPortalRedirect(req, { shopify: 'error', reason: 'MISSING_OAUTH_CONFIG' }));
    return;
  }

  const rawShop = asSingleQueryValue(req?.query?.shop);
  const code = asSingleQueryValue(req?.query?.code);
  const state = asSingleQueryValue(req?.query?.state);
  const hmac = asSingleQueryValue(req?.query?.hmac);

  const shop = rawShop ? normalizeShopDomain(rawShop) : null;
  if (!shop || !code || !state || !hmac) {
    setExpiredStateCookie(res);
    redirect(res, buildPortalRedirect(req, { shopify: 'error', reason: 'INVALID_CALLBACK_PARAMS' }));
    return;
  }

  const cookies = parseCookies(req?.headers?.cookie);
  const stateFromCookie = cookies['shopify_oauth_state'];

  if (!stateFromCookie || !safeCompare(stateFromCookie, state)) {
    setExpiredStateCookie(res);
    redirect(res, buildPortalRedirect(req, { shopify: 'error', reason: 'STATE_MISMATCH' }));
    return;
  }

  if (!verifyOAuthHmac(req?.url, hmac, config.clientSecret)) {
    setExpiredStateCookie(res);
    redirect(res, buildPortalRedirect(req, { shopify: 'error', reason: 'INVALID_HMAC' }));
    return;
  }

  try {
    const exchanged = await exchangeAccessToken(shop, code, config);
    if (!exchanged.ok) {
      setExpiredStateCookie(res);
      redirect(res, buildPortalRedirect(req, { shopify: 'error', reason: exchanged.error }));
      return;
    }

    const finalized = await finalizeOauth(shop, exchanged.accessToken, config);
    if (!finalized.ok) {
      setExpiredStateCookie(res);
      redirect(res, buildPortalRedirect(req, { shopify: 'error', reason: finalized.error, shop }));
      return;
    }

    setExpiredStateCookie(res);
    redirect(
      res,
      buildPortalRedirect(req, {
        shopify: 'connected',
        shop,
        ...(finalized.domain ? { domain: finalized.domain } : {}),
      })
    );
  } catch (error) {
    console.error('shopify-callback-function-error', error);
    setExpiredStateCookie(res);
    redirect(res, buildPortalRedirect(req, { shopify: 'error', reason: 'UNEXPECTED_CALLBACK_ERROR' }));
  }
}

module.exports = handler;
module.exports.config = {
  runtime: 'nodejs',
};
